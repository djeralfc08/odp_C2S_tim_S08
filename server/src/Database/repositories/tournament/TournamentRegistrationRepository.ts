import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ITournamentRegistrationRepository } from "../../../Domain/repositories/tournament/ITournamentRegistrationRepository";
import { TournamentRegistration } from "../../../Domain/models/TournamentRegistration";
import { TournamentRegistrationStatus } from "../../../Domain/enums/TournamentRegistrationStatus";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class TournamentRegistrationRepository implements ITournamentRegistrationRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  private map(r: RowDataPacket): TournamentRegistration {
    return new TournamentRegistration(
      r.tournament_id,
      r.team_id,
      new Date(r.registered_at),
      r.status as TournamentRegistrationStatus,
      r.seed ?? null,
      r.team_name ?? undefined,
      r.team_tag ?? undefined,
    );
  }

  async findByTournamentId(tournamentId: number): Promise<TournamentRegistration[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT tr.*, tm.name AS team_name, tm.tag AS team_tag
         FROM tournament_registrations tr
         JOIN teams tm ON tm.id = tr.team_id
         WHERE tr.tournament_id = ?
         ORDER BY tr.registered_at ASC`,
        [tournamentId],
      );
      return rows.map((r) => this.map(r));
    } catch (err) {
      this.logger.error("TournamentRegistrationRepository", "findByTournamentId failed", err);
      return [];
    } finally {
      res.conn.release();
    }
  }

  async findByTournamentAndTeam(
    tournamentId: number,
    teamId: number,
  ): Promise<TournamentRegistration | null> {
    const res = await this.db.getReadConnection();
    if (!res) return null;

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT tr.*, tm.name AS team_name, tm.tag AS team_tag
         FROM tournament_registrations tr
         JOIN teams tm ON tm.id = tr.team_id
         WHERE tr.tournament_id = ? AND tr.team_id = ?`,
        [tournamentId, teamId],
      );
      return rows.length > 0 ? this.map(rows[0]) : null;
    } catch (err) {
      this.logger.error("TournamentRegistrationRepository", "findByTournamentAndTeam failed", err);
      return null;
    } finally {
      res.conn.release();
    }
  }

  async countByTournamentId(tournamentId: number): Promise<number> {
    const res = await this.db.getReadConnection();
    if (!res) return 0;

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM tournament_registrations WHERE tournament_id = ?`,
        [tournamentId],
      );
      return Number(rows[0]?.cnt ?? 0);
    } catch (err) {
      this.logger.error("TournamentRegistrationRepository", "countByTournamentId failed", err);
      return 0;
    } finally {
      res.conn.release();
    }
  }

  async create(tournamentId: number, teamId: number): Promise<TournamentRegistration | null> {
    const res = await this.db.getWriteConnection();
    if (!res) return null;

    try {
      await res.conn.execute<ResultSetHeader>(
        `INSERT INTO tournament_registrations (tournament_id, team_id, status)
         VALUES (?, ?, ?)`,
        [tournamentId, teamId, TournamentRegistrationStatus.PENDING],
      );
      return this.findByTournamentAndTeam(tournamentId, teamId);
    } catch (err) {
      this.logger.error("TournamentRegistrationRepository", "create failed", err);
      return null;
    } finally {
      res.conn.release();
    }
  }

  async delete(tournamentId: number, teamId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `DELETE FROM tournament_registrations WHERE tournament_id = ? AND team_id = ?`,
        [tournamentId, teamId],
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("TournamentRegistrationRepository", "delete failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }

  async updateStatus(
    tournamentId: number,
    teamId: number,
    status: TournamentRegistrationStatus,
  ): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE tournament_registrations SET status = ?
         WHERE tournament_id = ? AND team_id = ?`,
        [status, tournamentId, teamId],
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("TournamentRegistrationRepository", "updateStatus failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }
}
