import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";
import {
  ITournamentRepository,
  TournamentFilters,
} from "../../../Domain/repositories/tournament/ITournamentRepository";
import { Tournament } from "../../../Domain/models/Tournament";
import {
  CreateTournamentDto,
  UpdateTournamentDto,
} from "../../../Domain/DTOs/tournament/CreateTournamentDto";
import { TournamentFormat } from "../../../Domain/enums/TournamentFormat";
import { TournamentStatus } from "../../../Domain/enums/TournamentStatus";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { toMysqlDateTime } from "../../../Domain/helpers/toMysqlDateTime";

export class TournamentRepository implements ITournamentRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  private readonly selectByIdSql = `SELECT t.*, g.name AS game_name,
    (SELECT COUNT(*) FROM tournament_registrations tr WHERE tr.tournament_id = t.id) AS registered_teams_count
   FROM tournaments t
   JOIN games g ON g.id = t.game_id
   WHERE t.id = ?`;

  private async fetchById(conn: PoolConnection, id: number): Promise<Tournament | null> {
    const [rows] = await conn.execute<RowDataPacket[]>(this.selectByIdSql, [id]);
    return rows.length > 0 ? this.map(rows[0]) : null;
  }

  private map(r: RowDataPacket): Tournament {
    return new Tournament(
      r.id,
      r.game_id,
      r.name,
      r.format as TournamentFormat,
      r.max_teams,
      new Date(r.registration_deadline),
      new Date(r.starts_at),
      r.ends_at ? new Date(r.ends_at) : null,
      r.prize_pool ?? null,
      r.status,
      new Date(r.created_at),
      new Date(r.updated_at),
      r.game_name ?? undefined,
      r.registered_teams_count !== undefined
        ? Number(r.registered_teams_count)
        : undefined,
    );
  }

  async findById(id: number): Promise<Tournament | null> {
    const res = await this.db.getReadConnection();
    if (!res) return null;

    try {
      return await this.fetchById(res.conn, id);
    } catch {
      this.logger.error("TournamentRepository", "findById failed");
      return null;
    } finally {
      res.conn.release();
    }
  }

  async findByName(name: string): Promise<Tournament | null> {
    const res = await this.db.getReadConnection();
    if (!res) return null;

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT t.*, g.name AS game_name
         FROM tournaments t
         JOIN games g ON g.id = t.game_id
         WHERE LOWER(t.name) = LOWER(?)`,
        [name.trim()],
      );
      return rows.length > 0 ? this.map(rows[0]) : null;
    } catch {
      this.logger.error("TournamentRepository", "findByName failed");
      return null;
    } finally {
      res.conn.release();
    }
  }

  async findAll(filters: TournamentFilters = {}): Promise<Tournament[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];

    const clauses: string[] = [];
    const values: (string | number)[] = [];

    if (filters.gameId !== undefined) {
      clauses.push("t.game_id = ?");
      values.push(filters.gameId);
    }
    if (filters.status !== undefined) {
      clauses.push("t.status = ?");
      values.push(filters.status);
    }
    if (filters.format !== undefined) {
      clauses.push("t.format = ?");
      values.push(filters.format);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT t.*, g.name AS game_name,
          (SELECT COUNT(*) FROM tournament_registrations tr WHERE tr.tournament_id = t.id) AS registered_teams_count
         FROM tournaments t
         JOIN games g ON g.id = t.game_id
         ${where}
         ORDER BY t.starts_at ASC`,
        values,
      );
      return rows.map((r) => this.map(r));
    } catch {
      this.logger.error("TournamentRepository", "findAll failed");
      return [];
    } finally {
      res.conn.release();
    }
  }

  async create(dto: CreateTournamentDto): Promise<Tournament> {
    const res = await this.db.getWriteConnection();
    if (!res) return new Tournament();

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO tournaments
           (game_id, name, format, max_teams, registration_deadline, starts_at, prize_pool, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dto.game_id,
          dto.name.trim(),
          dto.format,
          dto.max_teams,
          toMysqlDateTime(dto.registration_deadline),
          toMysqlDateTime(dto.starts_at),
          dto.prize_pool?.trim() || null,
          TournamentStatus.REGISTRATION_OPEN,
        ],
      );

      if (result.insertId === 0) return new Tournament();

      const created = await this.fetchById(res.conn, result.insertId);
      return created ?? new Tournament();
    } catch {
      this.logger.error("TournamentRepository", "create failed");
      return new Tournament();
    } finally {
      res.conn.release();
    }
  }

  async update(id: number, dto: UpdateTournamentDto): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (dto.name !== undefined) {
      fields.push("name = ?");
      values.push(dto.name.trim());
    }
    if (dto.game_id !== undefined) {
      fields.push("game_id = ?");
      values.push(dto.game_id);
    }
    if (dto.format !== undefined) {
      fields.push("format = ?");
      values.push(dto.format);
    }
    if (dto.max_teams !== undefined) {
      fields.push("max_teams = ?");
      values.push(dto.max_teams);
    }
    if (dto.registration_deadline !== undefined) {
      fields.push("registration_deadline = ?");
      values.push(toMysqlDateTime(dto.registration_deadline));
    }
    if (dto.starts_at !== undefined) {
      fields.push("starts_at = ?");
      values.push(toMysqlDateTime(dto.starts_at));
    }
    if (dto.prize_pool !== undefined) {
      fields.push("prize_pool = ?");
      values.push(dto.prize_pool?.trim() || null);
    }
    if (dto.status !== undefined) {
      fields.push("status = ?");
      values.push(dto.status);
    }

    if (fields.length === 0) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE tournaments SET ${fields.join(", ")} WHERE id = ?`,
        [...values, id],
      );
      return result.affectedRows > 0;
    } catch {
      this.logger.error("TournamentRepository", "update failed");
      return false;
    } finally {
      res.conn.release();
    }
  }

  async delete(id: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `DELETE FROM tournaments WHERE id = ?`,
        [id],
      );
      return result.affectedRows > 0;
    } catch {
      this.logger.error("TournamentRepository", "delete failed");
      return false;
    } finally {
      res.conn.release();
    }
  }
}
