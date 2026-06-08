import { RowDataPacket, ResultSetHeader } from "mysql2";
import { AuditLog } from "../../../Domain/models/AuditLog";
import { IAuditRepository } from "../../../Domain/repositories/audit/IAuditRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class AuditRepository implements IAuditRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService
  ) {}

  async findAll(page: number, pageSize: number): Promise<AuditLog[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];

    try {
      const offset = (page - 1) * pageSize;

      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT *
         FROM audit_logs
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [pageSize, offset]
      );

      return rows.map(
        (r) =>
          new AuditLog(
            r.id,
            r.user_id,
            r.action,
            r.entity,
            r.entity_id,
            r.details,
            new Date(r.created_at)
          )
      );
    } catch (err) {
      this.logger.error("AuditRepository", "findAll failed", err);
      return [];
    } finally {
      res.conn.release();
    }
  }

  async create(log: AuditLog): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, details)
         VALUES (?, ?, ?, ?, ?)`,
        [log.userId, log.action, log.entity, log.entityId, log.details],
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("AuditRepository", "create failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }
}