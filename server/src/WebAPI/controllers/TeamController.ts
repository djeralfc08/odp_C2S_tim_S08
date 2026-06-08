import { Request, Response, Router } from "express";
import { ITeamService } from "../../Domain/services/team/ITeamService";
import { UpdateTeamDto } from "../../Domain/DTOs/team/CreateTeamDto";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { validateIdParam } from "../validators/common/validateIdParam";
import { validateCreateTeam } from "../validators/team/validateCreateTeam";
import { validateUpdateTeam } from "../validators/team/validateUpdateTeam";


type AuthRequest = Request & {
  user?: {
    id: number;
    username: string;
    role: string;
  };
};

export class TeamController{

    private readonly router = Router();

   
    public constructor(private readonly teamService: ITeamService) {

        this.router.get("/teams", authenticate, this.getAll.bind(this));
        this.router.post("/teams", authenticate, this.create.bind(this));

        this.router.post("/teams/:id/leave", authenticate, this.leaveTeam.bind(this));

        this.router.post("/teams/:id/members/:userId", authenticate, this.addMember.bind(this));
        this.router.delete("/teams/:id/members/:userId", authenticate, this.removeMember.bind(this));
        this.router.patch("/teams/:id/members/:userId/role", authenticate, this.transferCaptain.bind(this));

        this.router.post( "/teams/:id/invite/respond", authenticate, this.respondToInvitation.bind(this));
        this.router.post( "/teams/:id/invite", authenticate,this.invitePlayerByGamerTag.bind(this));
        this.router.post( "/teams/:id/invite/:userId", authenticate, this.invitePlayer.bind(this));


        this.router.get("/teams/:id", this.getById.bind(this));
        this.router.put("/teams/:id", authenticate, this.update.bind(this));
        this.router.delete("/teams/:id", authenticate, this.deleteTeam.bind(this));

  
}

   private async getAll(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Missing user" });
    return;
  }

  const teams = await this.teamService.getAll(req.user.id);

  res.status(200).json({ success: true, data: teams });
}
    private async getById(req: Request, res: Response): Promise<void>
    {
        const idCheck = validateIdParam(req.params.id as string);
        if( !idCheck.valid )
        {
            res.status(400).json({success: false, message: idCheck.message});
            return;
        }

        const team = await this.teamService.getById(idCheck.value!);
        if( !team )
        {
            res.status(404).json({success: false, message: "Team not found!"});
            return;
        }

        res.status(200).json({success: true, data: team});
    }

    private async create(req: AuthRequest, res: Response): Promise<void>
    {
        if( !req.user )
        {
            res.status(401).json({success: false, message: "Missing user"});
            return;
        }

        const v = validateCreateTeam(req.body)
        if( !v.valid )
        {
            res.status(400).json({success: false, message: v.message});
            return;
        }

        const created = await this.teamService.create(req.user.id,v.dto!);
        if(created.id === 0)
        {
            res.status(409).json({success: false, message: "Team could not be created"});
            return;
        }

        res.status(201).json({success: true, data: created});

    }

    private async deleteTeam(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Missing user" });
      return;
    }

    const idCheck = validateIdParam(req.params.id as string);
    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }

    const ok = await this.teamService.delete(idCheck.value!, req.user.id);
    if (!ok) {
      res.status(403).json({ success: false, message: "Team not found or you are not captain" });
      return;
    }

    res.status(200).json({ success: true });
  }


    private async update(req: AuthRequest, res: Response): Promise<void>
    {

        if( !req.user )
        {
            res.status(401).json({success: false, message: "Missing user"});
            return;
        }

        const idCheck = validateIdParam(req.params.id as string);
        if( !idCheck.valid )
        {
            res.status(400).json({success: false, message: idCheck.message});
            return;
        }

        const v = validateUpdateTeam(req.body as UpdateTeamDto);
        if( !v.valid )
        {
            res.status(400).json({success: false, message: v.message});
            return;
        }

        const ok = await this.teamService.update(idCheck.value!,req.user.id,v.dto!);
        if( !ok )
        {
            res.status(403).json({success: false, message: "Team not found or you are not a captain"});
            return;
        }

        res.status(200).json({success: true});
    
    }

    private async addMember(req: AuthRequest, res: Response): Promise<void>
    {
        const teamIdCheck = validateIdParam(req.params.id as string);
        const userIdCheck = validateIdParam(req.params.userId as string);
    
        if( !teamIdCheck.valid || !userIdCheck.valid)
        {
            res.status(400).json({success: false, message:"Invalid id"});
            return;
        }

        const ok = await this.teamService.addMember(teamIdCheck.value!,userIdCheck.value!);
        if( !ok )
        {
            res.status(409).json({success: false, message: "User could not be added to team"});
            return;
        }

        res.status(200).json({success: true});
    
    
    }


    private async removeMember(req: AuthRequest, res: Response): Promise<void>
{
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: "Missing user"
        });
        return;
    }

    const teamIdCheck = validateIdParam(req.params.id as string);
    const userIdCheck = validateIdParam(req.params.userId as string);

    if (!teamIdCheck.valid || !userIdCheck.valid) {
        res.status(400).json({
            success: false,
            message: "Invalid id"
        });
        return;
    }

    const ok = await this.teamService.removeMember(
        teamIdCheck.value!,
        req.user.id,
        userIdCheck.value!
    );

    if (!ok) {
        res.status(409).json({
            success: false,
            message: "User could not be removed from team"
        });
        return;
    }

    res.status(200).json({
        success: true
    });
}

    private async transferCaptain(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Missing user" });
      return;
    }

    const teamIdCheck = validateIdParam(req.params.id as string);
    const userIdCheck = validateIdParam(req.params.userId as string);

    if (!teamIdCheck.valid || !userIdCheck.valid) {
      res.status(400).json({ success: false, message: "Invalid id" });
      return;
    }

    const ok = await this.teamService.transferCaptain(
      teamIdCheck.value!,
      req.user.id,
      userIdCheck.value!
    );

    if (!ok) {
      res.status(403).json({ success: false, message: "Captain transfer failed" });
      return;
    }

    res.status(200).json({ success: true });
  }

    private async leaveTeam(req: AuthRequest, res: Response): Promise<void> {

        if (!req.user) {
            res.status(401).json({ success: false, message: "Missing user" });
            return;
        }

        const idCheck = validateIdParam(req.params.id as string);
        if (!idCheck.valid) {
            res.status(400).json({ success: false, message: idCheck.message });
            return;
        }

        const ok = await this.teamService.leaveTeam(idCheck.value!, req.user.id);
        if (!ok) {
            res.status(403).json({
            success: false,
            message: "You are not a member or captain cannot leave team"
            });
            return;
        }

        res.status(200).json({ success: true });
        }


        private async invitePlayer(req: AuthRequest, res: Response): Promise<void> {

        if (!req.user) {
            res.status(401).json({ success: false, message: "Missing user" });
            return;
        }

        const teamIdCheck = validateIdParam(req.params.id as string);
        const userIdCheck = validateIdParam(req.params.userId as string);

        if (!teamIdCheck.valid || !userIdCheck.valid) {
            res.status(400).json({ success: false, message: "Invalid id" });
            return;
        }

        const ok = await this.teamService.invitePlayer(
            teamIdCheck.value!,
            req.user.id,
            userIdCheck.value!
        );

        if (!ok) {
            res.status(403).json({
                success: false,
                message: "Invitation could not be sent"
            });
            return;
        }

        res.status(200).json({ success: true });
    }

    private async respondToInvitation(req: AuthRequest, res: Response): Promise<void> {

    if (!req.user) {
        res.status(401).json({ success: false, message: "Missing user" });
        return;
    }

    const teamIdCheck = validateIdParam(req.params.id as string);

    if (!teamIdCheck.valid) {
        res.status(400).json({ success: false, message: "Invalid id" });
        return;
    }

    const accept = req.body?.accept;

if (typeof accept !== "boolean") {
  res.status(400).json({
    success: false,
    message: "Accept must be true or false"
  });
  return;
}

const status: "accepted" | "rejected" = accept ? "accepted" : "rejected";

  

    const ok = await this.teamService.respondToInvitation(
        teamIdCheck.value!,
        req.user.id,
        status
    );

    if (!ok) {
        res.status(403).json({
            success: false,
            message: "Could not respond to invitation"
        });
        return;
    }

    res.status(200).json({ success: true });
}

private async invitePlayerByGamerTag(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Missing user" });
    return;
  }

  const teamIdCheck = validateIdParam(req.params.id as string);
  if (!teamIdCheck.valid) {
    res.status(400).json({ success: false, message: teamIdCheck.message });
    return;
  }

  const gamerTag = req.body?.gamer_tag as string;

  if (!gamerTag || gamerTag.trim().length < 2) {
    res.status(400).json({
      success: false,
      message: "Gamer tag is required"
    });
    return;
  }

  const ok = await this.teamService.invitePlayerByGamerTag(
    teamIdCheck.value!,
    req.user.id,
    gamerTag.trim()
  );

  if (!ok) {
    res.status(403).json({
      success: false,
      message: "Invitation could not be sent"
    });
    return;
  }

  res.status(200).json({ success: true });
}

  public getRouter(): Router {
    return this.router;
  }
}
