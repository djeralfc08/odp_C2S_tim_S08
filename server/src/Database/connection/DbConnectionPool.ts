import mysql, { Pool, PoolConnection } from "mysql2/promise";
import dotenv from "dotenv";
import { DbNode } from "../../Domain/models/DbNode";
import { NodeStatus } from "../../Domain/enums/NodeStatus";
import {
  DEGRADED_LATENCY_MS,
  HEALTH_CHECK_TIMEOUT,
  HEALTH_CHECK_INTERVAL_MS,
} from "../../Domain/constants/Constants";
import { ILoggerService } from "../../Domain/services/logger/ILoggerService";
import { DbNodeInfo } from "../../Domain/types/DbNodeInfo";
import { FailoverService } from "../../Services/database/FailoverService";

dotenv.config();

const DB_NAME = process.env.DB_NAME ?? "project_db";

interface PoolConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export type { DbNodeInfo };

function createPool(cfg: PoolConfig): Pool {
  return mysql.createPool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: HEALTH_CHECK_TIMEOUT,
  });
}

function defaultPort(prefix: string): string {
  if (prefix === "DB_MASTER") return "13306";
  if (prefix === "DB_SLAVE1") return "13307";
  if (prefix === "DB_SLAVE2") return "13308";
  return "3306";
}

function poolConfigFromEnv(prefix: string): PoolConfig {
  return {
    host: process.env[`${prefix}_HOST`] ?? "localhost",
    port: parseInt(process.env[`${prefix}_PORT`] ?? defaultPort(prefix), 10),
    user: process.env[`${prefix}_USER`] ?? "root",
    password: process.env[`${prefix}_PASSWORD`] ?? "",
    database: process.env[`${prefix}_NAME`] ?? DB_NAME,
  };
}

const REPL_HOSTS: Record<string, string> = {
  master: process.env.DB_MASTER_REPL_HOST ?? "mysql-master",
  slave1: process.env.DB_SLAVE1_REPL_HOST ?? "mysql-slave1",
  slave2: process.env.DB_SLAVE2_REPL_HOST ?? "mysql-slave2",
};

export class DbManager {
  private master: DbNodeInfo;
  private readonly slaves: DbNodeInfo[];
  private slaveRrIndex = 0;
  private healthTimer: NodeJS.Timeout | null = null;
  private failoverCompleted = false;
  private failoverService: FailoverService | null = null;
  private skipMasterHealthCheck = false;
  private fallenMasterNode: DbNode | null = null;

  public constructor(private readonly logger: ILoggerService) {
    const masterCfg = poolConfigFromEnv("DB_MASTER");
    const masterPool = createPool(masterCfg);

    this.master = {
      name: "master",
      pool: masterPool,
      originalPool: masterPool,
      node: new DbNode("master", masterCfg.host, masterCfg.port, "master"),
    };

    const slave1Cfg = poolConfigFromEnv("DB_SLAVE1");
    const slave2Cfg = poolConfigFromEnv("DB_SLAVE2");
    const slave1Pool = createPool(slave1Cfg);
    const slave2Pool = createPool(slave2Cfg);

    this.slaves = [
      {
        name: "slave1",
        pool: slave1Pool,
        originalPool: slave1Pool,
        node: new DbNode("slave1", slave1Cfg.host, slave1Cfg.port, "slave"),
      },
      {
        name: "slave2",
        pool: slave2Pool,
        originalPool: slave2Pool,
        node: new DbNode("slave2", slave2Cfg.host, slave2Cfg.port, "slave"),
      },
    ];

  }

  public isFailoverEnabled(): boolean {
    return (process.env.DB_FAILOVER_ENABLED ?? "true").toLowerCase() === "true";
  }

  public hasFailoverCompleted(): boolean {
    return this.failoverCompleted;
  }

  public getMasterInfo(): DbNodeInfo {
    return this.master;
  }

  public getSlaves(): DbNodeInfo[] {
    return [...this.slaves];
  }

  public getReplicationHost(nodeName: string): string {
    return REPL_HOSTS[nodeName] ?? nodeName;
  }

  public applyPromotion(slaveName: string): void {
    const slave = this.slaves.find((s) => s.name === slaveName);
    if (!slave || this.failoverCompleted) return;

    const now = new Date();
    this.fallenMasterNode = new DbNode(
      "master-original",
      this.master.node.host,
      this.master.node.port,
      "master",
    );
    this.fallenMasterNode.status = NodeStatus.OFFLINE;
    this.fallenMasterNode.failoverAt = now;
    this.master.pool = slave.pool;
    this.master.node.host = slave.node.host;
    this.master.node.port = slave.node.port;
    this.master.node.promoted = true;
    this.master.node.originalRole = "master";
    this.master.node.failoverAt = now;
    this.master.node.status = slave.node.status;
    this.master.node.latencyMs = slave.node.latencyMs;

    slave.node.promoted = true;
    slave.node.failoverAt = now;
    slave.node.excludedFromReads = true;

    this.failoverCompleted = true;
    this.skipMasterHealthCheck = true;
  }

  private async checkNode(info: DbNodeInfo, usePool: Pool): Promise<void> {
    const start = Date.now();
    let conn: PoolConnection | null = null;
    try {
      conn = await usePool.getConnection();
      await conn.query("SELECT 1");
      const ms = Date.now() - start;
      info.node.latencyMs = ms;
      info.node.status =
        ms > DEGRADED_LATENCY_MS ? NodeStatus.DEGRADED : NodeStatus.HEALTHY;
    } catch {
      info.node.status = NodeStatus.OFFLINE;
      info.node.latencyMs = null;
      info.node.failedWrites++;
      this.logger.warn("DB", `Node ${info.name} failed health check`);
    } finally {
      if (conn) conn.release();
      info.node.lastCheck = new Date();
    }
  }

  public async runHealthCheck(): Promise<void> {
    if (!this.skipMasterHealthCheck) {
      await this.checkNode(this.master, this.master.originalPool);
    } else {
      await this.checkNode(this.master, this.master.pool);
    }

    await Promise.all(
      this.slaves.map((s) => this.checkNode(s, s.originalPool)),
    );

    this.logger.info(
      "DB",
      [this.master, ...this.slaves]
        .map((n) => `${n.name}=${n.node.status}${n.node.promoted ? "(promoted)" : ""}`)
        .join(" | "),
    );

    if (this.isFailoverEnabled() && this.master.node.status === NodeStatus.OFFLINE) {
      await this.getFailoverService().tryPromote();
    }
  }

  private getFailoverService(): FailoverService {
    if (!this.failoverService) {
      this.failoverService = new FailoverService(this, this.logger);
    }
    return this.failoverService;
  }

  public async init(): Promise<void> {
    await this.runHealthCheck();
    this.healthTimer = setInterval(
      () => void this.runHealthCheck(),
      HEALTH_CHECK_INTERVAL_MS,
    );
  }

  /** All writes (INSERT/UPDATE/DELETE) → Master only */
  public async getWriteConnection(): Promise<{ conn: PoolConnection; nodeName: string } | null> {
    if (this.master.node.status === NodeStatus.OFFLINE && !this.failoverCompleted) {
      await this.getFailoverService().tryPromote();
    }

    if (this.master.node.status === NodeStatus.OFFLINE) {
      this.logger.error("DB", "Master is OFFLINE — write not possible");
      return null;
    }

    try {
      const conn = await this.master.pool.getConnection();
      this.master.node.successfulWrites++;
      return { conn, nodeName: this.master.name };
    } catch {
      this.master.node.status = NodeStatus.OFFLINE;
      this.master.node.failedWrites++;
      this.logger.error("DB", "Failed to connect to master");
      return null;
    }
  }

  /** All reads (SELECT) → Round-Robin slaves, fallback to Master */
  public async getReadConnection(): Promise<{ conn: PoolConnection; nodeName: string } | null> {
    const n = this.slaves.length;
    for (let i = 0; i < n; i++) {
      const idx = (this.slaveRrIndex + i) % n;
      const info = this.slaves[idx];
      if (info.node.excludedFromReads) continue;
      if (info.node.status === NodeStatus.OFFLINE) continue;
      try {
        const conn = await info.pool.getConnection();
        this.slaveRrIndex = (idx + 1) % n;
        info.node.successfulWrites++;
        return { conn, nodeName: info.name };
      } catch {
        info.node.status = NodeStatus.OFFLINE;
        info.node.failedWrites++;
        this.logger.warn("DB", `Slave ${info.name} unreachable, trying next`);
      }
    }

    this.logger.warn("DB", "All slaves offline — falling back to master for read");
    if (this.master.node.status === NodeStatus.OFFLINE) {
      this.logger.error("DB", "Master also offline — read not possible");
      return null;
    }
    try {
      const conn = await this.master.pool.getConnection();
      this.master.node.successfulWrites++;
      return { conn, nodeName: this.master.name };
    } catch {
      this.master.node.status = NodeStatus.OFFLINE;
      this.logger.error("DB", "Failed to connect to master for fallback read");
      return null;
    }
  }

  public getNodes(): DbNode[] {
    const nodes = [this.master.node, ...this.slaves.map((s) => s.node)];
    if (this.fallenMasterNode) nodes.splice(1, 0, this.fallenMasterNode);
    return nodes;
  }

  public getSlaveRrIndex(): number {
    return this.slaveRrIndex;
  }

  public stop(): void {
    if (this.healthTimer) clearInterval(this.healthTimer);
  }
}
