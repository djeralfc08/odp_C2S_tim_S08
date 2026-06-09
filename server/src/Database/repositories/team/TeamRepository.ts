import { ResultSetHeader, RowDataPacket } from "mysql2";
import { ITeamRepository } from "../../../Domain/repositories/team/ITeamRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { Team } from "../../../Domain/models/Team";
import { TeamMemberDto } from "../../../Domain/DTOs/team/TeamDetailDto";


export class TeamRepository implements ITeamRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  private map(r: RowDataPacket): Team {
    return new Team(
      r.id,
      r.name,
      r.tag,
      r.logo_url ?? "",
      r.description ?? "",
      r.created_at,
      r.updated_at
    );
  }


  async findById(id: number): Promise<Team> {
    const res = await this.db.getReadConnection();
    if( !res ) return new Team();


    try{
      const [rows] = await res.conn.execute<RowDataPacket[]>(
         `SELECT * FROM teams WHERE id = ?`,
         [id]
      );

      return rows.length > 0 ? this.map(rows[0]) : new Team();
    } catch {
      this.logger.error("TeamRepository","findById failed");
      return new Team();

    }finally{
      res.conn.release();
    }
  }

  async findAll(): Promise<Team[]> {

    const res = await this.db.getReadConnection();
    if ( !res ) return [];

    try{
      const [rows] = await res.conn.execute<RowDataPacket[]>(
         `SELECT * FROM teams`
      );

      return rows.map((r) => this.map(r));
    } catch {
      this.logger.error("TeamRepository","findAll failed");
      return [];
    }finally{
      res.conn.release();
    }
  }

  async exists(id: number): Promise<boolean> {
    const res = await this.db.getReadConnection();
    if( !res ) return false;

    try{
      const [rows] = await res.conn.execute<RowDataPacket[]>(
         `SELECT COUNT(*) as cnt
          FROM teams
          WHERE id = ?`,
          [id]
      );

      return (rows[0]?.cnt ?? 0) > 0;
    } catch {
      this.logger.error("TeamRepository", "exists failed");
      return false;
      
    }finally{
      res.conn.release();
    }
  }

  async create(team: Team): Promise<Team> {
    const res = await this.db.getWriteConnection();
    if( !res ) return new Team();

    try{
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO teams (name,tag,logo_url,description)
         VALUES (?, ?, ?, ?)`,
        [
          team.name,
          team.tag,
          team.logoUrl,
          team.description
        ]
      );

      if(result.insertId === 0) return new Team();

      return new Team(
        result.insertId,
        team.name,
        team.tag,
        team.logoUrl,
        team.description
      );
    } catch {
      this.logger.error("TeamRepository","create failed");
      return new Team();
    }finally{
      res.conn.release();
    }
  }

  async update(team: Team): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if( !res ) return false;

    try{
      const[result] = await res.conn.execute<ResultSetHeader>(
         `UPDATE teams 
         SET name = ?, tag = ?, logo_url = ?, description = ?
         WHERE id = ?`,
        [team.name,team.tag,team.logoUrl,team.description,team.id]
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("TeamRepository", "update failed");
      return false;
    }finally{
      res.conn.release();
    }
  }

  async delete(id: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if( !res ) return false;

    try{
      const[result] = await res.conn.execute<ResultSetHeader>(
        ` DELETE FROM teams
          WHERE id = ?`,
          [id]
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("TeamRepository","delete failed");
      return false;
    }finally{
      res.conn.release();
    }
  }


  async isCaptain(teamId: number, userId: number): Promise<boolean> {
    const res = await this.db.getReadConnection();
    if (!res) return false;

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT 1 FROM team_members
         WHERE team_id = ? AND user_id = ? AND role = 'captain'
         LIMIT 1`,
        [teamId, userId],
      );
      return rows.length > 0;
    } catch {
      this.logger.error("TeamRepository", "isCaptain failed");
      return false;
    } finally {
      res.conn.release();
    }
  }

  async addCaptain(teamId: number, userId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if( !res ) return false;

    try{
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO team_members
       (team_id, user_id, role, joined_at)
       VALUES (?, ?, 'captain', NOW())`,
      [teamId, userId]
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("TeamRepository", "addCaptian failed");
      return false;
    }finally{
      res.conn.release();
    }
  }

  
  async isMember(teamId: number, userId: number): Promise<boolean> {
    const res = await this.db.getReadConnection();
    if (!res) return false;

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT 1 
         FROM team_members
         WHERE team_id = ?
         AND user_id = ? 
         LIMIT 1`,
        [teamId, userId],
      );
      return rows.length > 0;
    } catch {
      this.logger.error("TeamRepository", "isMember failed");
      return false;
    } finally {
      res.conn.release();
    }
  }

  async addMember(teamId: number, userId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if( !res ) return false;

    try{
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO team_members
       (team_id, user_id, role, joined_at)
       VALUES (?, ?, 'member', NOW())`,
      [teamId, userId]
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("TeamRepository", "addMember failed");
      return false;
    }finally{
      res.conn.release();
    }
  }

  async removeMember(teamId: number, userId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if( !res ) return false;

    try{
      const [result] = await res.conn.execute<ResultSetHeader>(
         `DELETE FROM team_members
          WHERE team_id = ?
          AND user_id = ?`
          ,
          [teamId,userId]
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("TeasmRepository", "removeMember failed");
      return false;
    }finally{
      res.conn.release();
    }
  }

  async changeMemberRole(teamId: number, userId: number, role: "captain" | "member"): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if( !res ) return false;

    try{
      const[result] = await res.conn.execute<ResultSetHeader>(
         `UPDATE team_members
          SET role = ?
          WHERE team_id = ?
          AND user_id=?`,
        [role,teamId,userId]
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("TeamRepository", "changeMemberRole failed");
      return false;
    }finally{
      res.conn.release();
    }
  }

  
  async sendInvitation(teamId: number, userId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO team_invitations
        (team_id, user_id, status, created_at)
        VALUES (?, ?, 'pending', NOW())`,
        [teamId, userId]
      );

      return result.affectedRows > 0;
    } catch {
      this.logger.error("TeamRepository", "sendInvitation failed");
      return false;
    } finally {
      res.conn.release();
    }
  }


  async respondInvitation(teamId: number, userId: number, status: "accepted" | "rejected"): Promise<boolean> {
  const res = await this.db.getWriteConnection();
  if (!res) return false;

  try {
    const [result] = await res.conn.execute<ResultSetHeader>(
      `UPDATE team_invitations
       SET status = ?
       WHERE team_id = ?
       AND user_id = ?
       AND status = 'pending'`,
      [status, teamId, userId]
    );

    return result.affectedRows > 0;
  } catch {
    this.logger.error("TeamRepository", "respondInvitation failed");
    return false;
  } finally {
    res.conn.release();
  }
}


async findUserIdByGamerTag(gamerTag: string): Promise<number | null> {
  const res = await this.db.getReadConnection();
  if (!res) return null;

  try {
    const [rows] = await res.conn.execute<RowDataPacket[]>(
      `SELECT id
       FROM users
       WHERE gamer_tag = ?
       LIMIT 1`,
      [gamerTag]
    );

    return rows.length > 0 ? rows[0].id : null;
  } catch {
    this.logger.error("TeamRepository", "findUserIdByGamerTag failed");
    return null;
  } finally {
    res.conn.release();
  }
}



async findMembersByTeamId(teamId: number): Promise<TeamMemberDto[]> {
  const res = await this.db.getReadConnection();
  if (!res) return [];

  try {
    const [rows] = await res.conn.execute<RowDataPacket[]>(
      `SELECT 
          tm.user_id,
          tm.team_id,
          u.gamer_tag AS username,
          tm.role,
          tm.joined_at
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = ?`,
      [teamId]
    );

    return rows as TeamMemberDto[];
  } catch {
    this.logger.error("TeamRepository", "findMembersByTeamId failed");
    return [];
  } finally {
    res.conn.release();
  }
}

  async countMembersByTeamId(teamId: number): Promise<number> {
    const res = await this.db.getReadConnection();
    if (!res) return 0;

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM team_members WHERE team_id = ?`,
        [teamId],
      );
      return Number(rows[0]?.cnt ?? 0);
    } catch {
      this.logger.error("TeamRepository", "countMembersByTeamId failed");
      return 0;
    } finally {
      res.conn.release();
    }
  }

  async findByUserId(userId: number): Promise<Team[]> {
  const res = await this.db.getReadConnection();
  if (!res) return [];

  try {
    const [rows] = await res.conn.execute<RowDataPacket[]>(
      `SELECT t.*
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = ?`,
      [userId]
    );

    return rows.map((r) => this.map(r));
  } catch {
    this.logger.error("TeamRepository", "findByUserId failed");
    return [];
  } finally {
    res.conn.release();
  }
}
}
