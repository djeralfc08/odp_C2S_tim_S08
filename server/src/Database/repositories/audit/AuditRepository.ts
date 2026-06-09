import { RowDataPacket, ResultSetHeader } from "mysql2";
import { AuditLog } from "../../../Domain/models/AuditLog";
import { AuditLogDto } from "../../../Domain/DTOs/audit/AuditLogDto";
import { IAuditRepository } from "../../../Domain/repositories/audit/IAuditRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class AuditRepository implements IAuditRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService
  ) {}

  async findAll(page: number, pageSize: number): Promise<AuditLogDto[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];

    const limit = Math.max(1, Math.min(100, Math.floor(pageSize)));
    const offset = Math.max(0, Math.floor((page - 1) * limit));

    try {
      const [rows] = await res.conn.query<RowDataPacket[]>(
        `SELECT al.id, al.user_id, al.action, al.entity, al.entity_id, al.details, al.created_at,
                u.gamer_tag AS username
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ORDER BY al.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`
      );

      return rows.map(
        (r) =>
          new AuditLogDto(
            r.id,
            r.user_id ?? null,
            r.username ?? null,
            r.action,
            r.entity ?? null,
            r.entity_id ?? null,
            r.details ?? null,
            new Date(r.created_at).toISOString(),
          )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error("AuditRepository", `findAll failed: ${msg}`);
      return [];
    } finally {
      res.conn.release();
    }
  }

  async countAll(): Promise<number> {
    const res = await this.db.getReadConnection();
    if (!res) return 0;

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM audit_logs`
      );
      return Number(rows[0]?.total ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error("AuditRepository", `countAll failed: ${msg}`);
      return 0;
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
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error("AuditRepository", `create failed: ${msg}`);
      return false;
    } finally {
      res.conn.release();
    }
  }
}
