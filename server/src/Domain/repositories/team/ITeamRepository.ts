import { Team } from "../../models/Team";
import { TeamMemberDto } from "../../DTOs/team/TeamDetailDto";

export interface ITeamRepository {

  create(team: Team): Promise<Team>;

  findById(id: number): Promise<Team>;

  findAll(): Promise<Team[]>;

  update(team: Team): Promise<boolean>;

  delete(id: number): Promise<boolean>;

  exists(id: number): Promise<boolean>;

  isCaptain(teamId: number, userId: number): Promise<boolean>;
 
  addCaptain(teamId: number, userId: number): Promise<boolean>;
  
  addMember(teamId: number, userId: number): Promise<boolean>;
  
  removeMember(teamId: number, userId: number): Promise<boolean>;
  
  changeMemberRole(teamId: number, userId: number, role: "captain" | "member"): Promise<boolean>;
  
  isMember(teamId: number, userId: number): Promise<boolean>;

  sendInvitation(teamId: number, userId: number): Promise<boolean>;

  respondInvitation(teamId: number, userId: number, status: "accepted" | "rejected"): Promise<boolean>;

  findUserIdByGamerTag(gamerTag: string): Promise<number | null>;

  findMembersByTeamId(teamId: number): Promise<TeamMemberDto[]>;

  findByUserId(userId: number): Promise<Team[]>;
}

