import { Request, Response, Router } from "express";
import { IMatchService } from "../../Domain/services/match/IMatchService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";
import { validateIdParam } from "../validators/common/validateIdParam";
import { AddMatchPlayerDto } from "../../Domain/DTOs/match/AddMatchPlayerDto";
import { SetMatchResultDto } from "../../Domain/DTOs/match/SetMatchResultDto";

type AuthRequest = Request & {
  user?: {
    id: number;
    username: string;
    role: string;
  };
};

export class MatchController {
  private readonly router = Router();

  public constructor(private readonly matchService: IMatchService) {
    this.router.get("/matches/tournament/:tournamentId", this.getByTournament.bind(this));
    this.router.get("/matches/my", authenticate, this.getMyMatches.bind(this));
    this.router.get("/matches/:id", this.getById.bind(this));

    this.router.patch(
      "/matches/:id/result",
      authenticate,
      authorize(UserRole.ADMIN),
      this.setResult.bind(this)
    );

    this.router.post("/matches/:id/players", authenticate, this.addPlayer.bind(this));
    this.router.put("/matches/:id/players/:userId", authenticate, this.updatePlayerNotes.bind(this));
    this.router.delete("/matches/:id/players/:userId", authenticate, this.removePlayer.bind(this));
  }

  private async getByTournament(req: Request, res: Response): Promise<void> {
    const idCheck = validateIdParam(req.params.tournamentId as string);

    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }

    const matches = await this.matchService.getByTournamentId(idCheck.value!);
    res.status(200).json({ success: true, data: matches });
  }

  private async getById(req: Request, res: Response): Promise<void> {
    const idCheck = validateIdParam(req.params.id as string);

    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }

    const match = await this.matchService.getById(idCheck.value!);

    if (!match) {
      res.status(404).json({ success: false, message: "Match not found" });
      return;
    }

    res.status(200).json({ success: true, data: match });
  }

  private async getMyMatches(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Missing user" });
      return;
    }

    const matches = await this.matchService.getMyMatches(req.user.id);
    res.status(200).json({ success: true, data: matches });
  }

  private async setResult(req: AuthRequest, res: Response): Promise<void> {
    const idCheck = validateIdParam(req.params.id as string);

    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }

    const dto = req.body as SetMatchResultDto;

    if (!dto.score || !dto.winner_id) {
      res.status(400).json({
        success: false,
        message: "Score and winner_id are required"
      });
      return;
    }

    const ok = await this.matchService.setResult(idCheck.value!, dto);

    if (!ok) {
      res.status(400).json({
        success: false,
        message: "Match result could not be set"
      });
      return;
    }

    res.status(200).json({ success: true });
  }

  private async addPlayer(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Missing user" });
      return;
    }

    const idCheck = validateIdParam(req.params.id as string);

    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }

    const dto = req.body as AddMatchPlayerDto | undefined;

if (!dto || !dto.user_id || !dto.team_id) {
      res.status(400).json({
        success: false,
        message: "user_id and team_id are required"
      });
      return;
    }

    const ok = await this.matchService.addPlayer(idCheck.value!, req.user.id, dto);

    if (!ok) {
      res.status(403).json({
        success: false,
        message: "Player could not be added to match"
      });
      return;
    }

    res.status(200).json({ success: true });
  }

  private async updatePlayerNotes(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Missing user" });
      return;
    }

    const matchIdCheck = validateIdParam(req.params.id as string);
    const userIdCheck = validateIdParam(req.params.userId as string);

    if (!matchIdCheck.valid || !userIdCheck.valid) {
      res.status(400).json({ success: false, message: "Invalid id" });
      return;
    }

    const notes = req.body?.performance_notes;

    if (typeof notes !== "string") {
      res.status(400).json({
        success: false,
        message: "performance_notes must be string"
      });
      return;
    }

    const ok = await this.matchService.updatePlayerNotes(
      matchIdCheck.value!,
      req.user.id,
      userIdCheck.value!,
      notes
    );

    if (!ok) {
      res.status(403).json({
        success: false,
        message: "Player notes could not be updated"
      });
      return;
    }

    res.status(200).json({ success: true });
  }

  private async removePlayer(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Missing user" });
      return;
    }

    const matchIdCheck = validateIdParam(req.params.id as string);
    const userIdCheck = validateIdParam(req.params.userId as string);

    if (!matchIdCheck.valid || !userIdCheck.valid) {
      res.status(400).json({ success: false, message: "Invalid id" });
      return;
    }

    const ok = await this.matchService.removePlayer(
      matchIdCheck.value!,
      req.user.id,
      userIdCheck.value!
    );

    if (!ok) {
      res.status(403).json({
        success: false,
        message: "Player could not be removed from match"
      });
      return;
    }

    res.status(200).json({ success: true });
  }

  public getRouter(): Router {
    return this.router;
  }
}