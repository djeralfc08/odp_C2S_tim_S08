import { RowDataPacket, ResultSetHeader } from "mysql2";
import { IWatchlistRepository } from "../../../Domain/repositories/watchlist/IWatchlistRepository";
import { Tournament } from "../../../Domain/models/Tournament";
import { TournamentFormat } from "../../../Domain/enums/TournamentFormat";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class WatchlistRepository implements IWatchlistRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  private mapTournament(r: RowDataPacket): Tournament {
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
    );
  }

  async findTournamentsByUserId(userId: number): Promise<Tournament[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT t.*, g.name AS game_name
         FROM user_watchlist w
         JOIN tournaments t ON t.id = w.tournament_id
         JOIN games g ON g.id = t.game_id
         WHERE w.user_id = ?
         ORDER BY w.added_at DESC`,
        [userId],
      );
      return rows.map((r) => this.mapTournament(r));
    } catch (err) {
      this.logger.error("WatchlistRepository", "findTournamentsByUserId failed", err);
      return [];
    } finally {
      res.conn.release();
    }
  }

  async add(userId: number, tournamentId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      await res.conn.execute<ResultSetHeader>(
        `INSERT INTO user_watchlist (user_id, tournament_id) VALUES (?, ?)`,
        [userId, tournamentId],
      );
      return true;
    } catch (err) {
      this.logger.error("WatchlistRepository", "add failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }

  async remove(userId: number, tournamentId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `DELETE FROM user_watchlist WHERE user_id = ? AND tournament_id = ?`,
        [userId, tournamentId],
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("WatchlistRepository", "remove failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }
}
