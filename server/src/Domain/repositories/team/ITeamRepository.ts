export interface ITeamRepository {
  isCaptain(teamId: number, userId: number): Promise<boolean>;
}
