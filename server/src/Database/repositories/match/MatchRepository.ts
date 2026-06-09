import { ResultSetHeader, RowDataPacket } from "mysql2";
import { IMatchRepository } from "../../../Domain/repositories/match/IMatchRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { Match } from "../../../Domain/models/Match";
import { MatchPlayerDto } from "../../../Domain/DTOs/match/MatchPlayerDto";

export class MatchRepository implements IMatchRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService
  ) {}

  private map(r: RowDataPacket): Match {
    return new Match(
      r.id,
      r.tournament_id,
      r.round,
      r.match_number,
      r.team1_id,
      r.team2_id,
      r.winner_id,
      r.score,
      r.status,
      r.scheduled_at,
      r.next_match_id,
      r.tournament_name,
      r.team1_name,
      r.team2_name
    );
  }

  async findByTournamentId(tournamentId: number): Promise<Match[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT
            m.id,
            m.tournament_id,
            t.name AS tournament_name,
            m.round_number AS round,
            m.bracket_position AS match_number,
            m.team1_id,
            team1.name AS team1_name,
            m.team2_id,
            team2.name AS team2_name,
            m.winner_team_id AS winner_id,
            m.score,
            m.match_status AS status,
            m.scheduled_at,
            NULL AS next_match_id
         FROM matches m
         JOIN tournaments t ON t.id = m.tournament_id
         LEFT JOIN teams team1 ON team1.id = m.team1_id
         LEFT JOIN teams team2 ON team2.id = m.team2_id
         WHERE m.tournament_id = ?
         ORDER BY m.round_number ASC, m.bracket_position ASC`,
        [tournamentId]
      );

      return rows.map((r) => this.map(r));
    } catch {
      this.logger.error("MatchRepository", "findByTournamentId failed");
      return [];
    } finally {
      res.conn.release();
    }
  }

  async findById(id: number): Promise<Match | null> {
    const res = await this.db.getReadConnection();
    if (!res) return null;

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT
            m.id,
            m.tournament_id,
            t.name AS tournament_name,
            m.round_number AS round,
            m.bracket_position AS match_number,
            m.team1_id,
            team1.name AS team1_name,
            m.team2_id,
            team2.name AS team2_name,
            m.winner_team_id AS winner_id,
            m.score,
            m.match_status AS status,
            m.scheduled_at,
            NULL AS next_match_id
         FROM matches m
         JOIN tournaments t ON t.id = m.tournament_id
         LEFT JOIN teams team1 ON team1.id = m.team1_id
         LEFT JOIN teams team2 ON team2.id = m.team2_id
         WHERE m.id = ?
         LIMIT 1`,
        [id]
      );

      return rows.length > 0 ? this.map(rows[0]) : null;
    } catch {
      this.logger.error("MatchRepository", "findById failed");
      return null;
    } finally {
      res.conn.release();
    }
  }

  async findPlayersByMatchId(matchId: number): Promise<MatchPlayerDto[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT
            mp.match_id,
            mp.user_id,
            mp.team_id,
            u.gamer_tag AS username,
            mp.performance_notes
         FROM match_players mp
         JOIN users u ON u.id = mp.user_id
         WHERE mp.match_id = ?`,
        [matchId]
      );

      return rows as MatchPlayerDto[];
    } catch {
      this.logger.error("MatchRepository", "findPlayersByMatchId failed");
      return [];
    } finally {
      res.conn.release();
    }
  }

  async findByUserId(userId: number): Promise<Match[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT DISTINCT
            m.id,
            m.tournament_id,
            t.name AS tournament_name,
            m.round_number AS round,
            m.bracket_position AS match_number,
            m.team1_id,
            team1.name AS team1_name,
            m.team2_id,
            team2.name AS team2_name,
            m.winner_team_id AS winner_id,
            m.score,
            m.match_status AS status,
            m.scheduled_at,
            NULL AS next_match_id
         FROM matches m
         JOIN match_players mp ON mp.match_id = m.id
         JOIN tournaments t ON t.id = m.tournament_id
         LEFT JOIN teams team1 ON team1.id = m.team1_id
         LEFT JOIN teams team2 ON team2.id = m.team2_id
         WHERE mp.user_id = ?
         ORDER BY m.scheduled_at ASC`,
        [userId]
      );

      return rows.map((r) => this.map(r));
    } catch {
      this.logger.error("MatchRepository", "findByUserId failed");
      return [];
    } finally {
      res.conn.release();
    }
  }

  async updateResult(matchId: number, score: string, winnerId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE matches
         SET score = ?, winner_team_id = ?, match_status = 'completed'
         WHERE id = ?`,
        [score, winnerId, matchId]
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("MatchRepository", "updateResult failed");
      return false;
    } finally {
      res.conn.release();
    }
  }

  async addPlayer(matchId: number, userId: number, teamId: number, notes?: string): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO match_players
         (match_id, user_id, team_id, performance_notes)
         VALUES (?, ?, ?, ?)`,
        [matchId, userId, teamId, notes ?? null]
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("MatchRepository", "addPlayer failed");
      return false;
    } finally {
      res.conn.release();
    }
  }

  async updatePlayerNotes(matchId: number, userId: number, notes: string): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE match_players
         SET performance_notes = ?
         WHERE match_id = ? AND user_id = ?`,
        [notes, matchId, userId]
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("MatchRepository", "updatePlayerNotes failed");
      return false;
    } finally {
      res.conn.release();
    }
  }

  async removePlayer(matchId: number, userId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `DELETE FROM match_players
         WHERE match_id = ? AND user_id = ?`,
        [matchId, userId]
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("MatchRepository", "removePlayer failed");
      return false;
    } finally {
      res.conn.release();
    }
  }

  async findNextMatch(tournamentId: number, nextRound: number, nextPosition: number): Promise<Match | null> {
  const res = await this.db.getReadConnection();
  if (!res) return null;

  try {
    const [rows] = await res.conn.execute<RowDataPacket[]>(
      `SELECT
          m.id,
          m.tournament_id,
          t.name AS tournament_name,
          m.round_number AS round,
          m.bracket_position AS match_number,
          m.team1_id,
          team1.name AS team1_name,
          m.team2_id,
          team2.name AS team2_name,
          m.winner_team_id AS winner_id,
          m.score,
          m.match_status AS status,
          m.scheduled_at,
          NULL AS next_match_id
       FROM matches m
       JOIN tournaments t ON t.id = m.tournament_id
       LEFT JOIN teams team1 ON team1.id = m.team1_id
       LEFT JOIN teams team2 ON team2.id = m.team2_id
       WHERE m.tournament_id = ?
       AND m.round_number = ?
       AND m.bracket_position = ?
       LIMIT 1`,
      [tournamentId, nextRound, nextPosition]
    );

    return rows.length > 0 ? this.map(rows[0]) : null;
  } catch {
    this.logger.error("MatchRepository", "findNextMatch failed");
    return null;
  } finally {
    res.conn.release();
  }
}

async advanceWinnerToNextMatch(nextMatchId: number, winnerId: number, slot: "team1" | "team2"): Promise<boolean> {
  const res = await this.db.getWriteConnection();
  if (!res) return false;

  try {
    const column = slot === "team1" ? "team1_id" : "team2_id";

    const [result] = await res.conn.execute<ResultSetHeader>(
      `UPDATE matches
       SET ${column} = ?
       WHERE id = ?`,
      [winnerId, nextMatchId]
    );

    return result.affectedRows > 0;
  } catch {
    this.logger.error("MatchRepository", "advanceWinnerToNextMatch failed");
    return false;
  } finally {
    res.conn.release();
  }
}

async isUserCaptainOfTeam(userId: number, teamId: number): Promise<boolean> {
  const res = await this.db.getReadConnection();
  if (!res) return false;

  try {
    const [rows] = await res.conn.execute<RowDataPacket[]>(
      `SELECT 1
       FROM team_members
       WHERE user_id = ?
       AND team_id = ?
       AND role = 'captain'
       LIMIT 1`,
      [userId, teamId]
    );

    return rows.length > 0;
  } catch {
    this.logger.error("MatchRepository", "isUserCaptainOfTeam failed");
    return false;
  } finally {
    res.conn.release();
  }
}
   

  async deleteByTournamentId(tournamentId: number): Promise<boolean> {
  const res = await this.db.getWriteConnection();
  if (!res) return false;

  try {
    await res.conn.execute<ResultSetHeader>(
      `DELETE FROM matches
       WHERE tournament_id = ?`,
      [tournamentId]
    );

    return true;
  } catch {
    this.logger.error("MatchRepository", "deleteByTournamentId failed");
    return false;
  } finally {
    res.conn.release();
  }
}

async createBracketMatch(tournamentId: number, round: number, matchNumber: number, team1Id: number | null, team2Id: number | null): Promise<boolean> {
  const res = await this.db.getWriteConnection();
  if (!res) return false;

  try {
    const [result] = await res.conn.execute<ResultSetHeader>(
      `INSERT INTO matches
       (tournament_id, round_number, bracket_position, team1_id, team2_id, match_status)
       VALUES (?, ?, ?, ?, ?, 'scheduled')`,
      [tournamentId, round, matchNumber, team1Id, team2Id]
    );

    return result.affectedRows > 0;
  } catch {
    this.logger.error("MatchRepository", "createBracketMatch failed");
    return false;
  } finally {
    res.conn.release();
  }
}


  
}