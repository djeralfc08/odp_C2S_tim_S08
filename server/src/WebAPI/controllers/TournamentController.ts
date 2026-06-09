import { Request, Response, Router } from "express";
import { ITournamentService } from "../../Domain/services/tournament/ITournamentService";
import { ITournamentRegistrationService } from "../../Domain/services/tournament/ITournamentRegistrationService";
import { IWatchlistService } from "../../Domain/services/watchlist/IWatchlistService";
import { UpdateTournamentDto } from "../../Domain/DTOs/tournament/CreateTournamentDto";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";
import { validateIdParam } from "../validators/common/validateIdParam";
import { validateCreateTournament } from "../validators/tournament/validateCreateTournament";
import { validateUpdateTournament } from "../validators/tournament/validateUpdateTournament";
import { validateListFilters } from "../validators/tournament/validateListFilters";
import { validateRegister } from "../validators/tournament/validateRegister";
import { validateRegistrationStatus } from "../validators/tournament/validateRegistrationStatus";

export class TournamentController {
  private readonly router = Router();

  public constructor(
    private tournamentService: ITournamentService,
    private readonly registrationService: ITournamentRegistrationService,
    private readonly watchlistService: IWatchlistService,
  ) {
    this.router.get("/tournaments", this.getAll.bind(this));
    this.router.get("/tournaments/watchlist", authenticate, this.getWatchlist.bind(this));
    this.router.get("/tournaments/:id", this.getById.bind(this));
    this.router.get(
      "/tournaments/:id/registrations",
      authenticate,
      authorize(UserRole.ADMIN),
      this.getRegistrations.bind(this),
    );

    this.router.post("/tournaments", authenticate, authorize(UserRole.ADMIN), this.create.bind(this));
    this.router.put("/tournaments/:id", authenticate, authorize(UserRole.ADMIN), this.update.bind(this));
    this.router.delete("/tournaments/:id", authenticate, authorize(UserRole.ADMIN), this.delete.bind(this));
    this.router.patch(
      "/tournaments/:id/registrations/:teamId",
      authenticate,
      authorize(UserRole.ADMIN),
      this.updateRegistration.bind(this),
    );
    this.router.post(
      "/tournaments/:id/generate-bracket",
      authenticate,
      authorize(UserRole.ADMIN),
      this.generateBracket.bind(this),
    );

    this.router.post("/tournaments/:id/register", authenticate, this.register.bind(this));
    this.router.delete("/tournaments/:id/register/:teamId", authenticate, this.unregister.bind(this));
    this.router.post("/tournaments/:id/watch", authenticate, this.addToWatchlist.bind(this));
    this.router.delete("/tournaments/:id/watch", authenticate, this.removeFromWatchlist.bind(this));
  }

  private async getAll(req: Request, res: Response): Promise<void> {
    const filtersCheck = validateListFilters({
      game_id: req.query.game_id as string | undefined,
      status: req.query.status as string | undefined,
      format: req.query.format as string | undefined,
    });
    if (!filtersCheck.valid) {
      res.status(400).json({ success: false, message: filtersCheck.message });
      return;
    }

    const tournaments = await this.tournamentService.getAll(filtersCheck.filters);
    res.status(200).json({ success: true, data: tournaments });
  }

  private async getById(req: Request, res: Response): Promise<void> {
    const idCheck = validateIdParam(req.params.id as string);
    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }

    const tournament = await this.tournamentService.getById(idCheck.value!);
    if (!tournament) {
      res.status(404).json({ success: false, message: "Tournament not found" });
      return;
    }

    const registrations = await this.registrationService.getByTournamentId(idCheck.value!);
    res.status(200).json({
      success: true,
      data: { ...tournament, registrations, matches: [] },
    });
  }

  private async create(req: Request, res: Response): Promise<void> {
    const v = validateCreateTournament(req.body);
    if (!v.valid) {
      res.status(400).json({ success: false, message: v.message });
      return;
    }

    const created = await this.tournamentService.create(req.user!.id, v.dto!);
    if (created == null) {
      res.status(409).json({
        success: false,
        message: "Tournament already exists or could not be created",
      });
      return;
    }
    res.status(201).json({ success: true, data: created });
  }

  private async update(req: Request, res: Response): Promise<void> {
    const idCheck = validateIdParam(req.params.id as string);
    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }

    const current = await this.tournamentService.getById(idCheck.value!);
    if (!current) {
      res.status(404).json({ success: false, message: "Tournament not found" });
      return;
    }

    const v = validateUpdateTournament(req.body as UpdateTournamentDto, {
      currentFormat: current.format,
      currentRegistrationDeadline: current.registration_deadline,
      currentStartsAt: current.starts_at,
    });
    if (!v.valid) {
      res.status(400).json({ success: false, message: v.message });
      return;
    }

    const ok = await this.tournamentService.update(req.user!.id, idCheck.value!, v.dto!);
    if (!ok) {
      res.status(404).json({ success: false, message: "Tournament not found or update failed" });
      return;
    }
    res.status(200).json({ success: true });
  }

  private async delete(req: Request, res: Response): Promise<void> {
    const idCheck = validateIdParam(req.params.id as string);
    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }

    const ok = await this.tournamentService.delete(req.user!.id, idCheck.value!);
    if (!ok) {
      res.status(404).json({ success: false, message: "Tournament not found" });
      return;
    }
    res.status(200).json({ success: true });
  }

  private async getRegistrations(req: Request, res: Response): Promise<void> {
    const idCheck = validateIdParam(req.params.id as string, "tournament id");
    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }

    const tournament = await this.tournamentService.getById(idCheck.value!);
    if (!tournament) {
      res.status(404).json({ success: false, message: "Tournament not found" });
      return;
    }

    const registrations = await this.registrationService.getByTournamentId(idCheck.value!);
    res.status(200).json({ success: true, data: registrations });
  }

  private async register(req: Request, res: Response): Promise<void> {
    const idCheck = validateIdParam(req.params.id as string, "tournament id");
    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }

    const bodyCheck = validateRegister(req.body);
    if (!bodyCheck.valid) {
      res.status(400).json({ success: false, message: bodyCheck.message });
      return;
    }

    const result = await this.registrationService.register(
      idCheck.value!,
      bodyCheck.teamId!,
      req.user!.id,
    );
    if (!result.success) {
      res.status(409).json({ success: false, message: result.message });
      return;
    }
    res.status(200).json({ success: true });
  }

  private async unregister(req: Request, res: Response): Promise<void> {
    const idCheck = validateIdParam(req.params.id as string, "tournament id");
    const teamCheck = validateIdParam(req.params.teamId as string, "team id");
    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }
    if (!teamCheck.valid) {
      res.status(400).json({ success: false, message: teamCheck.message });
      return;
    }

    const ok = await this.registrationService.unregister(idCheck.value!, teamCheck.value!);
    if (!ok) {
      res.status(404).json({
        success: false,
        message: "Unregister failed (tournament closed or registration not found)",
      });
      return;
    }
    res.status(200).json({ success: true });
  }

  private async updateRegistration(req: Request, res: Response): Promise<void> {
    const idCheck = validateIdParam(req.params.id as string, "tournament id");
    const teamCheck = validateIdParam(req.params.teamId as string, "team id");
    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }
    if (!teamCheck.valid) {
      res.status(400).json({ success: false, message: teamCheck.message });
      return;
    }

    const statusCheck = validateRegistrationStatus(req.body);
    if (!statusCheck.valid) {
      res.status(400).json({ success: false, message: statusCheck.message });
      return;
    }

    const ok = await this.registrationService.updateStatus(
      idCheck.value!,
      teamCheck.value!,
      statusCheck.status!,
    );
    if (!ok) {
      res.status(404).json({ success: false, message: "Registration not found or update failed" });
      return;
    }
    res.status(200).json({ success: true });
  }

  private async generateBracket(_req: Request, res: Response): Promise<void> {
    const idCheck = validateIdParam(_req.params.id as string, "tournament id");

  if (!idCheck.valid) {
    res.status(400).json({
      success: false,
      message: idCheck.message
    });
    return;
  }

  const ok = await this.registrationService.generateBracket(idCheck.value!);

  if (!ok) {
    res.status(409).json({
      success: false,
      message: "Bracket could not be generated"
    });
    return;
  }

  res.status(200).json({
    success: true
  });
  }

  private async getWatchlist(req: Request, res: Response): Promise<void> {
    const data = await this.watchlistService.getByUserId(req.user!.id);
    res.status(200).json({ success: true, data });
  }

  private async addToWatchlist(req: Request, res: Response): Promise<void> {
    const idCheck = validateIdParam(req.params.id as string);
    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }

    const ok = await this.watchlistService.add(req.user!.id, idCheck.value!);
    if (!ok) {
      res.status(404).json({ success: false, message: "Tournament not found or already on watchlist" });
      return;
    }
    res.status(200).json({ success: true });
  }

  private async removeFromWatchlist(req: Request, res: Response): Promise<void> {
    const idCheck = validateIdParam(req.params.id as string);
    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }

    const ok = await this.watchlistService.remove(req.user!.id, idCheck.value!);
    if (!ok) {
      res.status(404).json({ success: false, message: "Tournament not on watchlist" });
      return;
    }
    res.status(200).json({ success: true });
  }

  public getRouter(): Router {
    return this.router;
  }
}
