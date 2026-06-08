import { Team } from "../../models/Team";
import { CreateTeamDto, UpdateTeamDto } from "../../DTOs/team/CreateTeamDto";
import { TeamDetailDto } from "../../DTOs/team/TeamDetailDto";

export interface ITeamService{
    create(userId: number, dto: CreateTeamDto): Promise<Team>;

    getById(id: number): Promise<TeamDetailDto | null>;
    
    getAll(userId: number): Promise<Team[]>;

    update(id: number, userId: number, dto: UpdateTeamDto): Promise<boolean>;

    delete(id: number, userId: number): Promise<boolean>;

    isCaptian(teamId: number, userId: number): Promise<boolean>;

    addMember(teamId: number, userId: number): Promise<boolean>;

removeMember(teamId: number, currentUserId: number, userIdToRemove: number): Promise<boolean>;
    transferCaptain(teamId: number, currentUserId: number, newCaptainId: number): Promise<boolean>;

    leaveTeam(teamId: number, userId: number): Promise<boolean>;

    invitePlayer(teamId: number, captainId: number, userId: number): Promise<boolean>;

    respondToInvitation(teamId: number, userId: number, status: "accepted" | "rejected"): Promise<boolean>;

    invitePlayerByGamerTag(teamId: number, captainId: number, gamerTag: string): Promise<boolean>;

    
   
}
