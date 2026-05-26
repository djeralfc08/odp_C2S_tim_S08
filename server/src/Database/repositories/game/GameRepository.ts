import { RowDataPacket, ResultSetHeader } from "mysql2";
import { IGameRepository, GameWithStats } from "../../../Domain/repositories/game/IGameRepository";
import { Game } from "../../../Domain/models/Game";
import { CreateGameDto, UpdateGameDto } from "../../../Domain/DTOs/game/CreateGameDto";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class GameRepository implements IGameRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  private map(r: RowDataPacket): Game {
    return new Game(
      r.id,
      r.name,
      r.logo_url ?? "",
      r.genre ?? "",
      r.max_players_per_team,
      new Date(r.created_at),
      new Date(r.updated_at),
    );
  }

  async findById(id: number): Promise<Game | null> {
    const res = await this.db.getReadConnection();
    if (!res) return null;

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM games WHERE id = ?`,
        [id],
      );
      return rows.length > 0 ? this.map(rows[0]) : null;
    } catch (err) {
      this.logger.error("GameRepository", "findById failed", err);
      return null;
    } finally {
      res.conn.release();
    }
  }

  async findByName(name: string): Promise<Game | null> {
    const res = await this.db.getReadConnection();
    if (!res) return null;

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM games WHERE LOWER(name) = LOWER(?)`,
        [name.trim()],
      );
      return rows.length > 0 ? this.map(rows[0]) : null;
    } catch (err) {
      this.logger.error("GameRepository", "findByName failed", err);
      return null;
    } finally {
      res.conn.release();
    }
  }

  async findAll(): Promise<GameWithStats[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT g.*,
          COALESCE((
            SELECT COUNT(*) FROM tournaments t
            WHERE t.game_id = g.id
              AND t.status IN ('registration_open', 'registration_locked', 'in_progress')
          ), 0) AS active_tournaments_count
         FROM games g
         ORDER BY g.name ASC`,
      );
      return rows.map((r) => ({
        game: this.map(r),
        activeTournamentsCount: Number(r.active_tournaments_count ?? 0),
      }));
    } catch (err) {
      this.logger.error("GameRepository", "findAll failed", err);
      return [];
    } finally {
      res.conn.release();
    }
  }

  async create(dto: CreateGameDto): Promise<Game> {
    const res = await this.db.getWriteConnection();
    if (!res) return new Game();

    const genre = dto.genre?.trim() ?? "";
    const logoUrl = dto.logo_url?.trim() ?? null;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO games (name, logo_url, genre, max_players_per_team)
         VALUES (?, ?, ?, ?)`,
        [dto.name.trim(), logoUrl, genre, dto.max_team_size],
      );

      if (result.insertId === 0) return new Game();

      return new Game(
        result.insertId,
        dto.name.trim(),
        logoUrl ?? "",
        genre,
        dto.max_team_size,
      );
    } catch (err) {
      this.logger.error("GameRepository", "create failed", err);
      return new Game();
    } finally {
      res.conn.release();
    }
  }

  async update(id: number, dto: UpdateGameDto): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (dto.name !== undefined) {
      fields.push("name = ?");
      values.push(dto.name.trim());
    }
    if (dto.logo_url !== undefined) {
      fields.push("logo_url = ?");
      values.push(dto.logo_url.trim() || null);
    }
    if (dto.genre !== undefined) {
      fields.push("genre = ?");
      values.push(dto.genre.trim());
    }
    if (dto.max_team_size !== undefined) {
      fields.push("max_players_per_team = ?");
      values.push(dto.max_team_size);
    }

    if (fields.length === 0) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE games SET ${fields.join(", ")} WHERE id = ?`,
        [...values, id],
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("GameRepository", "update failed", err);
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
        `DELETE FROM games WHERE id = ?`,
        [id],
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("GameRepository", "delete failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }
}
