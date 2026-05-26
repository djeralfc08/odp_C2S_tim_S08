import { Request, Response, Router } from "express";
import { IGameService } from "../../Domain/services/game/IGameService";
import { CreateGameDto, UpdateGameDto } from "../../Domain/DTOs/game/CreateGameDto";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";

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
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid id" });
      return;
    }
    const game = await this.gameService.getById(id);
    if (!game) {
      res.status(404).json({ success: false, message: "Game not found" });
      return;
    }
    res.status(200).json({ success: true, data: game });
  }

  private async create(req: Request, res: Response): Promise<void> {
    const body = req.body as {
      name?: string;
      logo_url?: string;
      genre?: string;
      max_team_size?: number;
    };

    const name = body.name?.trim() ?? "";
    const maxTeamSize = parseInt(String(body.max_team_size ?? ""), 10);

    if (!name) {
      res.status(400).json({ success: false, message: "Name is required" });
      return;
    }
    if (isNaN(maxTeamSize) || maxTeamSize < 1 || maxTeamSize > 20) {
      res.status(400).json({ success: false, message: "max_team_size must be between 1 and 20" });
      return;
    }

    const dto = new CreateGameDto(name, body.logo_url, body.genre, maxTeamSize);
    const created = await this.gameService.create(dto);

    if (!created) {
      res.status(409).json({ success: false, message: "Game already exists or could not be created" });
      return;
    }
    res.status(201).json({ success: true, data: created });
  }

  private async update(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid id" });
      return;
    }

    const body = req.body as UpdateGameDto;
    const dto: UpdateGameDto = {};

    if (body.name !== undefined) dto.name = body.name;
    if (body.logo_url !== undefined) dto.logo_url = body.logo_url;
    if (body.genre !== undefined) dto.genre = body.genre;
    if (body.max_team_size !== undefined) {
      const maxTeamSize = parseInt(String(body.max_team_size), 10);
      if (isNaN(maxTeamSize) || maxTeamSize < 1 || maxTeamSize > 20) {
        res.status(400).json({ success: false, message: "max_team_size must be between 1 and 20" });
        return;
      }
      dto.max_team_size = maxTeamSize;
    }

    const ok = await this.gameService.update(id, dto);
    if (!ok) {
      res.status(404).json({ success: false, message: "Game not found or update failed" });
      return;
    }
    res.status(200).json({ success: true });
  }

  private async delete(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid id" });
      return;
    }
    const ok = await this.gameService.delete(id);
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
