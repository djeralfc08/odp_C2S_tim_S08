import { PoolConnection, RowDataPacket } from "mysql2/promise";
import { DbManager } from "../../Database/connection/DbConnectionPool";
import { DbNodeInfo } from "../../Domain/types/DbNodeInfo";
import { NodeStatus } from "../../Domain/enums/NodeStatus";
import { ILoggerService } from "../../Domain/services/logger/ILoggerService";

const FAILOVER_LOCK = "pulsegrid_db_failover";

export class FailoverService {
  private failoverInProgress = false;

  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  public async tryPromote(): Promise<void> {
    if (!this.db.isFailoverEnabled()) return;
    if (this.db.getMasterInfo().node.status !== NodeStatus.OFFLINE) return;
    if (this.failoverInProgress) return;

    const synced = await this.syncFromPromotedPeer();
    if (synced || this.db.hasFailoverCompleted()) return;

    const candidate = this.pickCandidate();
    if (!candidate) {
      this.logger.error("Failover", "Master offline but no eligible slave for promotion");
      return;
    }

    this.failoverInProgress = true;
    try {
      const lockConn = await candidate.pool.getConnection();
      let acquired = false;
      try {
        acquired = await this.acquireLock(lockConn);
        if (!acquired) {
          await this.syncFromPromotedPeer();
          return;
        }

        if (await this.isSlavePromoted(lockConn)) {
          this.db.applyPromotion(candidate.name);
          return;
        }

        await this.promoteSlave(lockConn);
        this.db.applyPromotion(candidate.name);

        const binlog = await this.readMasterStatus(lockConn);
        if (!binlog) {
          this.logger.warn("Failover", "Could not read binlog position — remaining slave not repointed");
          return;
        }

        const others = this.db.getSlaves().filter((s) => s.name !== candidate.name);
        for (const other of others) {
          if (other.node.status === NodeStatus.OFFLINE) continue;
          await this.repointReplica(other, candidate, binlog);
        }

        this.logger.info("Failover", `Promoted ${candidate.name} to master`);
      } finally {
        if (acquired) await this.releaseLock(lockConn);
        lockConn.release();
      }
    } catch {
      this.logger.error("Failover", "Promotion failed");
    } finally {
      this.failoverInProgress = false;
    }
  }

  private pickCandidate(): DbNodeInfo | null {
    const order = ["slave1", "slave2"];
    for (const name of order) {
      const slave = this.db.getSlaves().find((s) => s.name === name);
      if (!slave || slave.node.excludedFromReads) continue;
      if (slave.node.status === NodeStatus.HEALTHY || slave.node.status === NodeStatus.DEGRADED) {
        return slave;
      }
    }
    return null;
  }

  private async syncFromPromotedPeer(): Promise<boolean> {
    for (const slave of this.db.getSlaves()) {
      if (slave.node.status === NodeStatus.OFFLINE) continue;
      const conn = await slave.pool.getConnection();
      try {
        if (await this.isSlavePromoted(conn)) {
          this.db.applyPromotion(slave.name);
          this.logger.info("Failover", `Synced local pools to promoted ${slave.name}`);
          return true;
        }
      } catch {
        // try next slave
      } finally {
        conn.release();
      }
    }
    return false;
  }

  private async acquireLock(conn: PoolConnection): Promise<boolean> {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT GET_LOCK(?, 0) AS acquired",
      [FAILOVER_LOCK],
    );
    return rows[0]?.acquired === 1;
  }

  private async releaseLock(conn: PoolConnection): Promise<void> {
    await conn.query("SELECT RELEASE_LOCK(?)", [FAILOVER_LOCK]);
  }

  private async isSlavePromoted(conn: PoolConnection): Promise<boolean> {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT @@read_only AS ro",
    );
    const ro = Number(rows[0]?.ro ?? 1);
    const [repl] = await conn.query<RowDataPacket[]>("SHOW REPLICA STATUS");
    const ioRunning = repl[0]?.Replica_IO_Running;
    return ro === 0 && ioRunning !== "Yes";
  }

  private async promoteSlave(conn: PoolConnection): Promise<void> {
    await conn.query("STOP REPLICA");
    await conn.query("RESET REPLICA ALL");
    await conn.query("SET GLOBAL read_only = 0");
    await conn.query("SET GLOBAL super_read_only = 0");
    try {
      await conn.query("RESET BINARY LOGS AND GTIDS");
    } catch {
      await conn.query("RESET MASTER");
    }
  }

  private async readMasterStatus(
    conn: PoolConnection,
  ): Promise<{ file: string; pos: number } | null> {
    const [rows] = await conn.query<RowDataPacket[]>("SHOW MASTER STATUS");
    const file = rows[0]?.File as string | undefined;
    const pos = Number(rows[0]?.Pos ?? 0);
    if (!file || !pos) return null;
    return { file, pos };
  }

  private async repointReplica(
    replica: DbNodeInfo,
    newMaster: DbNodeInfo,
    binlog: { file: string; pos: number },
  ): Promise<void> {
    const replHost = this.db.getReplicationHost(newMaster.name);
    const replUser = process.env.REPL_USER ?? "replicator";
    const replPass = process.env.REPL_PASSWORD ?? "repl1234";

    const conn = await replica.pool.getConnection();
    try {
      await conn.query("STOP REPLICA");
      await conn.query("RESET REPLICA ALL");
      await conn.query(
        `CHANGE REPLICATION SOURCE TO
           SOURCE_HOST = ?,
           SOURCE_PORT = 3306,
           SOURCE_USER = ?,
           SOURCE_PASSWORD = ?,
           SOURCE_LOG_FILE = ?,
           SOURCE_LOG_POS = ?,
           GET_SOURCE_PUBLIC_KEY = 1`,
        [replHost, replUser, replPass, binlog.file, binlog.pos],
      );
      await conn.query("START REPLICA");
      this.logger.info("Failover", `Repointed ${replica.name} to replicate from ${replHost}`);
    } finally {
      conn.release();
    }
  }
}
