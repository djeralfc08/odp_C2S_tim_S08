import { RowDataPacket } from "mysql2";
import { ITeamRepository } from "../../../Domain/repositories/team/ITeamRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class TeamRepository implements ITeamRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

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
    } catch (err) {
      this.logger.error("TeamRepository", "isCaptain failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }
}
