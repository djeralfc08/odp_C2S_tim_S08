import { ITeamService } from "../../Domain/services/team/ITeamService";
import { ITeamRepository } from "../../Domain/repositories/team/ITeamRepository";
import { Team} from "../../Domain/models/Team";
import { CreateTeamDto, UpdateTeamDto } from "../../Domain/DTOs/team/CreateTeamDto";
import { User } from "../../Domain/models/User";
import { TeamDetailDto } from "../../Domain/DTOs/team/TeamDetailDto";

export class TeamService implements ITeamService{
    public constructor(private readonly teamRepo: ITeamRepository){}
    
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
        console.log("UPDATE TEAM:", { id, userId, dto });
        
        const existing = await this.teamRepo.findById(id);
        console.log("EXISTING TEAM:", existing);
        if( existing.id === 0) return false;
        

        const isCaptian = await this.teamRepo.isCaptain(id,userId);
        console.log("IS CAPTAIN:", isCaptian);

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

        return await this.teamRepo.update(updated);
    }
    async delete(id: number, userId: number): Promise<boolean> {
        const existing = await this.teamRepo.findById(id);
        if(existing.id === 0) return false;

        const isCaptian = await this.teamRepo.isCaptain(id,userId);
        if( !isCaptian ) return false;

        return await this.teamRepo.delete(id);

    }
    async isCaptian(teamId: number, userId: number): Promise<boolean> {
        return await this.teamRepo.isCaptain(teamId,userId);
    }
    async addMember(teamId: number, userId: number): Promise<boolean> {
        const existing = await this.teamRepo.findById(teamId);
        if( existing.id === 0) return false;

        const alreadyMember = await this.teamRepo.isMember(teamId,userId);
        if( alreadyMember ) return false;

        return await this.teamRepo.addMember(teamId,userId);
    }
    

    async removeMember(teamId: number, currentUserId: number, userIdToRemove: number): Promise<boolean> {
    const currentUserIsCaptain = await this.teamRepo.isCaptain(teamId, currentUserId);
    if (!currentUserIsCaptain) return false;

    const userToRemoveIsMember = await this.teamRepo.isMember(teamId, userIdToRemove);
    if (!userToRemoveIsMember) return false;

    const userToRemoveIsCaptain = await this.teamRepo.isCaptain(teamId, userIdToRemove);
    if (userToRemoveIsCaptain) return false;

    return await this.teamRepo.removeMember(teamId, userIdToRemove);
}


    async transferCaptain(teamId: number, currentUserId: number, newCaptainId: number): Promise<boolean> {
        const currentIsCaptain = await this.teamRepo.isCaptain(teamId,currentUserId);
        if( !currentIsCaptain ) return false;

        const newUserIsMember = await this.teamRepo.isMember(teamId,newCaptainId);
        if( !newUserIsMember ) return false;

        const oldCaptaindDemoted = await this.teamRepo.changeMemberRole(teamId,currentUserId,"member");

        if( !oldCaptaindDemoted ) return false;

        return await this.teamRepo.changeMemberRole(teamId,newCaptainId,"captain");
    }

    
    async leaveTeam(teamId: number, userId: number): Promise<boolean> {
        const isMember = await this.teamRepo.isMember(teamId, userId);
        if (!isMember) return false;

        const isCaptain = await this.teamRepo.isCaptain(teamId, userId);
        if (isCaptain) return false;

        return await this.teamRepo.removeMember(teamId, userId);
        }
    
    async invitePlayer(teamId: number,captainId: number,userId: number): Promise<boolean> {
        const isCaptain = await this.teamRepo.isCaptain(teamId, captainId);
        if (!isCaptain) return false;

        const alreadyMember = await this.teamRepo.isMember(teamId, userId);
        if (alreadyMember) return false;

        return await this.teamRepo.sendInvitation(teamId, userId);
        }

async respondToInvitation(teamId: number, userId: number, status: "accepted" | "rejected"): Promise<boolean> {
    const responded = await this.teamRepo.respondInvitation(teamId, userId, status);
    if (!responded) return false;

    if (status === "accepted") {
        return await this.teamRepo.addMember(teamId, userId);
    }

    return true;
    }


    async invitePlayerByGamerTag(teamId: number, captainId: number, gamerTag: string): Promise<boolean> {
        const userId = await this.teamRepo.findUserIdByGamerTag(gamerTag);

        if (!userId) return false;

        return await this.invitePlayer(teamId, captainId, userId);
    }
}