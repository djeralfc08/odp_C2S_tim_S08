import { ITeamService } from "../../Domain/services/team/ITeamService";
import { ITeamRepository } from "../../Domain/repositories/team/ITeamRepository";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { Team} from "../../Domain/models/Team";
import { CreateTeamDto, UpdateTeamDto } from "../../Domain/DTOs/team/CreateTeamDto";
import { TeamDetailDto } from "../../Domain/DTOs/team/TeamDetailDto";

export class TeamService implements ITeamService{
    public constructor(
        private readonly teamRepo: ITeamRepository,
        private readonly auditService: IAuditService,
    ){}
    
    async create(userId: number, dto: CreateTeamDto): Promise<Team>
    {
        const team = new Team(
            0,
            dto.name,
            dto.tag,
            dto.logoUrl ?? "",
            dto.description ?? ""
        );

        const created = await this.teamRepo.create(team);

        if(created.id === 0)
        {
            return new Team();
        }

        const captainAdded = await this.teamRepo.addCaptain(created.id,userId);

        if( !captainAdded)
        {
            return new Team();
        }

        await this.auditService.log(userId, "CREATE", "team", created.id);
        return created;
    }
      
  async getById(id: number): Promise<TeamDetailDto | null> {
  const team = await this.teamRepo.findById(id);

  if (team.id === 0) {
    return null;
  }

  const members = await this.teamRepo.findMembersByTeamId(id);

  return {
    id: team.id,
    name: team.name,
    tag: team.tag,
    logo_url: team.logoUrl,
    description: team.description,
    created_at: team.createdAt,
    updated_at: team.updatedAt,
    members
  };
}

    
   async getAll(userId: number): Promise<Team[]> {
  return await this.teamRepo.findByUserId(userId);
}
    async update(id: number, userId: number, dto: UpdateTeamDto): Promise<boolean> {
        const existing = await this.teamRepo.findById(id);
        if( existing.id === 0) return false;

        const isCaptian = await this.teamRepo.isCaptain(id,userId);
        if( !isCaptian ) return false;

        const updated = new Team(
            id,
            dto.name ?? existing.name,
            dto.tag ?? existing.tag,
            dto.logoUrl ?? existing.logoUrl,
            dto.description ?? existing.description,
            existing.createdAt,
            existing.updatedAt
        );

        const ok = await this.teamRepo.update(updated);
        if (ok) await this.auditService.log(userId, "UPDATE", "team", id);
        return ok;
    }
    async delete(id: number, userId: number): Promise<boolean> {
        const existing = await this.teamRepo.findById(id);
        if(existing.id === 0) return false;

        const isCaptian = await this.teamRepo.isCaptain(id,userId);
        if( !isCaptian ) return false;

        const ok = await this.teamRepo.delete(id);
        if (ok) await this.auditService.log(userId, "DELETE", "team", id);
        return ok;

    }
    async isCaptian(teamId: number, userId: number): Promise<boolean> {
        return await this.teamRepo.isCaptain(teamId,userId);
    }
    async addMember(teamId: number, userId: number): Promise<boolean> {
        const existing = await this.teamRepo.findById(teamId);
        if( existing.id === 0) return false;

        const alreadyMember = await this.teamRepo.isMember(teamId,userId);
        if( alreadyMember ) return false;

        const ok = await this.teamRepo.addMember(teamId,userId);
        if (ok) {
            await this.auditService.log(null, "ADD_MEMBER", "team", teamId, `user_id=${userId}`);
        }
        return ok;
    }
    

    async removeMember(teamId: number, currentUserId: number, userIdToRemove: number): Promise<boolean> {
    const currentUserIsCaptain = await this.teamRepo.isCaptain(teamId, currentUserId);
    if (!currentUserIsCaptain) return false;

    const userToRemoveIsMember = await this.teamRepo.isMember(teamId, userIdToRemove);
    if (!userToRemoveIsMember) return false;

    const userToRemoveIsCaptain = await this.teamRepo.isCaptain(teamId, userIdToRemove);
    if (userToRemoveIsCaptain) return false;

    const ok = await this.teamRepo.removeMember(teamId, userIdToRemove);
    if (ok) {
        await this.auditService.log(currentUserId, "REMOVE_MEMBER", "team", teamId, `user_id=${userIdToRemove}`);
    }
    return ok;
}


    async transferCaptain(teamId: number, currentUserId: number, newCaptainId: number): Promise<boolean> {
        const currentIsCaptain = await this.teamRepo.isCaptain(teamId,currentUserId);
        if( !currentIsCaptain ) return false;

        const newUserIsMember = await this.teamRepo.isMember(teamId,newCaptainId);
        if( !newUserIsMember ) return false;

        const oldCaptaindDemoted = await this.teamRepo.changeMemberRole(teamId,currentUserId,"member");

        if( !oldCaptaindDemoted ) return false;

        const ok = await this.teamRepo.changeMemberRole(teamId,newCaptainId,"captain");
        if (ok) {
            await this.auditService.log(currentUserId, "TRANSFER_CAPTAIN", "team", teamId, `new_captain_id=${newCaptainId}`);
        }
        return ok;
    }

    
    async leaveTeam(teamId: number, userId: number): Promise<boolean> {
        const isMember = await this.teamRepo.isMember(teamId, userId);
        if (!isMember) return false;

        const isCaptain = await this.teamRepo.isCaptain(teamId, userId);
        if (isCaptain) return false;

        const ok = await this.teamRepo.removeMember(teamId, userId);
        if (ok) await this.auditService.log(userId, "LEAVE_TEAM", "team", teamId);
        return ok;
        }
    
    async invitePlayer(teamId: number,captainId: number,userId: number): Promise<boolean> {
        const isCaptain = await this.teamRepo.isCaptain(teamId, captainId);
        if (!isCaptain) return false;

        const alreadyMember = await this.teamRepo.isMember(teamId, userId);
        if (alreadyMember) return false;

        const ok = await this.teamRepo.sendInvitation(teamId, userId);
        if (ok) {
            await this.auditService.log(captainId, "INVITE_PLAYER", "team", teamId, `user_id=${userId}`);
        }
        return ok;
        }

async respondToInvitation(teamId: number, userId: number, status: "accepted" | "rejected"): Promise<boolean> {
    const responded = await this.teamRepo.respondInvitation(teamId, userId, status);
    if (!responded) return false;

    if (status === "accepted") {
        const added = await this.teamRepo.addMember(teamId, userId);
        if (added) {
            await this.auditService.log(userId, "INVITE_ACCEPTED", "team", teamId);
        }
        return added;
    }

    await this.auditService.log(userId, "INVITE_REJECTED", "team", teamId);
    return true;
    }


    async invitePlayerByGamerTag(teamId: number, captainId: number, gamerTag: string): Promise<boolean> {
        const userId = await this.teamRepo.findUserIdByGamerTag(gamerTag);

        if (!userId) return false;

        return await this.invitePlayer(teamId, captainId, userId);
    }
}