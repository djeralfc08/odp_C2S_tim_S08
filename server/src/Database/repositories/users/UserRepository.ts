import { RowDataPacket, ResultSetHeader } from "mysql2";
import { IUserRepository } from "../../../Domain/repositories/users/IUserRepository";
import { PublicUserDto } from "../../../Domain/DTOs/users/PublicUserDto";
import { User } from "../../../Domain/models/User";
import { UserRole } from "../../../Domain/enums/UserRole";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class UserRepository implements IUserRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  private map(r: RowDataPacket): User {
    return new User(
      r.id,
      r.gamer_tag,
      r.email,
      r.role as UserRole,
      r.password_hash,
      r.is_active,
      r.full_name ?? "",
      r.profile_image ?? null,
    );
  }

  async create(user: User): Promise<User> {
    const res = await this.db.getWriteConnection();
    if (!res) return new User();

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO users (gamer_tag, full_name, email, role, password_hash, profile_image)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          user.username,
          user.fullName || user.username,
          user.email,
          user.role,
          user.passwordHash,
          user.profileImage,
        ]
      );

      if (result.insertId === 0) return new User();

      return new User(
        result.insertId,
        user.username,
        user.email,
        user.role,
        user.passwordHash
      );
    } catch {
      this.logger.error("UserRepository", "create failed");
      return new User();
    } finally {
      res.conn.release();
    }
  }

  async findPublicById(id: number): Promise<PublicUserDto | null> {
    const res = await this.db.getReadConnection();
    if (!res) return null;

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT id, gamer_tag, full_name, profile_image
         FROM users
         WHERE id = ? AND is_active = 1`,
        [id],
      );
      if (rows.length === 0) return null;
      const r = rows[0];
      return new PublicUserDto(r.id, r.gamer_tag, r.full_name ?? "", r.profile_image ?? null);
    } catch {
      this.logger.error("UserRepository", "findPublicById failed");
      return null;
    } finally {
      res.conn.release();
    }
  }

  async findById(id: number): Promise<User> {
    const res = await this.db.getReadConnection();
    if (!res) return new User();

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM users WHERE id = ?`,
        [id]
      );

      return rows.length > 0 ? this.map(rows[0]) : new User();
    } catch {
      this.logger.error("UserRepository", "findById failed");
      return new User();
    } finally {
      res.conn.release();
    }
  }

  async findByUsername(username: string): Promise<User> {
    const res = await this.db.getReadConnection();
    if (!res) return new User();

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM users WHERE gamer_tag = ?`,
        [username]
      );

      return rows.length > 0 ? this.map(rows[0]) : new User();
    } catch {
      this.logger.error("UserRepository", "findByUsername failed");
      return new User();
    } finally {
      res.conn.release();
    }
  }

  async findByEmail(email: string): Promise<User> {
    const res = await this.db.getReadConnection();
    if (!res) return new User();

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM users WHERE email = ?`,
        [email]
      );

      return rows.length > 0 ? this.map(rows[0]) : new User();
    } catch {
      this.logger.error("UserRepository", "findByEmail failed");
      return new User();
    } finally {
      res.conn.release();
    }
  }

  async findAll(): Promise<User[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM users ORDER BY id ASC`
      );

      return rows.map((r) => this.map(r));
    } catch {
      this.logger.error("UserRepository", "findAll failed");
      return [];
    } finally {
      res.conn.release();
    }
  }

  async update(user: User): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE users 
         SET gamer_tag = ?, email = ?, role = ?, is_active = ? 
         WHERE id = ?`,
        [user.username, user.email, user.role, user.isActive, user.id]
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("UserRepository", "update failed");
      return false;
    } finally {
      res.conn.release();
    }
  }

  async deactivate(id: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE users SET is_active = 0 WHERE id = ?`,
        [id]
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("UserRepository", "deactivate failed");
      return false;
    } finally {
      res.conn.release();
    }
  }

  async exists(id: number): Promise<boolean> {
    const res = await this.db.getReadConnection();
    if (!res) return false;

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as cnt FROM users WHERE id = ?`,
        [id]
      );

      return (rows[0]?.cnt ?? 0) > 0;
    } catch {
      this.logger.error("UserRepository", "exists failed");
      return false;
    } finally {
      res.conn.release();
    }
  }




  async updateRole(id: number, role: string): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE users
         SET role = ?
         WHERE id = ?`,
        [role, id],
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("UserRepository", "updateRole failed");
      return false;
    } finally {
      res.conn.release();
    }
  }

  async updateProfile(id: number, fullName: string, profileImage: string | null): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE users SET full_name = ?, profile_image = ? WHERE id = ?`,
        [fullName, profileImage, id],
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("UserRepository", "updateProfile failed");
      return false;
    } finally {
      res.conn.release();
    }
  }
}