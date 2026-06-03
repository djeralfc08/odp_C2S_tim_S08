import { Request, Response, Router } from "express";
import { IGameService } from "../../Domain/services/game/IGameService";
import { UpdateGameDto } from "../../Domain/DTOs/game/CreateGameDto";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";
import { validateIdParam } from "../validators/common/validateIdParam";
import { validateCreateGame } from "../validators/game/validateCreateGame";
import { validateUpdateGame } from "../validators/game/validateUpdateGame";

export class GameController {
  private readonly router = Router();

  public constructor(private readonly gameService: IGameService) {
    this.router.get("/games", this.getAll.bind(this));
    this.router.get("/games/:id", this.getById.bind(this));
    this.router.post("/games", authenticate, authorize(UserRole.ADMIN), this.create.bind(this));
    this.router.put("/games/:id", authenticate, authorize(UserRole.ADMIN), this.update.bind(this));
    this.router.delete("/games/:id", authenticate, authorize(UserRole.ADMIN), this.delete.bind(this));
  }

  private async getAll(_req: Request, res: Response): Promise<void> {
    const games = await this.gameService.getAll();
    res.status(200).json({ success: true, data: games });
  }

  private async getById(req: Request, res: Response): Promise<void> {
    const idCheck = validateIdParam(req.params.id as string);
    if (!idCheck.valid) {
      res.status(400).json({ success: false, message: idCheck.message });
      return;
    }

    const game = await this.gameService.getById(idCheck.value!);
    if (!game) {
      res.status(404).json({ success: false, message: "Game not found" });
      return;
    }
    res.status(200).json({ success: true, data: game });
  }

  private async create(req: Request, res: Response): Promise<void> {
    const v = validateCreateGame(req.body);
    if (!v.valid) {
      res.status(400).json({ success: false, message: v.message });
      return;
    }

    const created = await this.gameService.create(v.dto!);
    if (!created) {
      res.status(409).json({ success: false, message: "Game already exists or could not be created" });
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

    const v = validateUpdateGame(req.body as UpdateGameDto);
    if (!v.valid) {
      res.status(400).json({ success: false, message: v.message });
      return;
    }

    const ok = await this.gameService.update(idCheck.value!, v.dto!);
    if (!ok) {
      res.status(404).json({ success: false, message: "Game not found or update failed" });
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

    const ok = await this.gameService.delete(idCheck.value!);
    if (!ok) {
      res.status(404).json({
        success: false,
        message: "Game not found or cannot be deleted (linked tournaments?)",
      });
      return;
    }
    res.status(200).json({ success: true });
  }

  public getRouter(): Router {
    return this.router;
  }
}
