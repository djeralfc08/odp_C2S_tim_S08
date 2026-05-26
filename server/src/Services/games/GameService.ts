import { IGameService } from "../../Domain/services/game/IGameService";
import { IGameRepository } from "../../Domain/repositories/game/IGameRepository";
import { GameDto } from "../../Domain/DTOs/game/GameDto";
import { CreateGameDto, UpdateGameDto } from "../../Domain/DTOs/game/CreateGameDto";
import { Game } from "../../Domain/models/Game";

export class GameService implements IGameService {
  public constructor(private readonly gameRepo: IGameRepository) {}

  async getAll(): Promise<GameDto[]> {
    const rows = await this.gameRepo.findAll();
    return rows.map(({ game, activeTournamentsCount }) =>
      this.toDto(game, activeTournamentsCount),
    );
  }

  async getById(id: number): Promise<GameDto | null> {
    const game = await this.gameRepo.findById(id);
    if (!game) return null;
    return this.toDto(game);
  }

  async create(dto: CreateGameDto): Promise<GameDto | null> {
    if (!dto.name?.trim()) return null;
    if (dto.max_team_size < 1 || dto.max_team_size > 20) return null;

    const existing = await this.gameRepo.findByName(dto.name);
    if (existing) return null;

    const created = await this.gameRepo.create(dto);
    if (created.id === 0) return null;

    return this.toDto(created);
  }

  async update(id: number, dto: UpdateGameDto): Promise<boolean> {
    const current = await this.gameRepo.findById(id);
    if (!current) return false;

    if (dto.name !== undefined && !dto.name.trim()) return false;
    if (dto.max_team_size !== undefined && (dto.max_team_size < 1 || dto.max_team_size > 20)) {
      return false;
    }

    if (dto.name !== undefined) {
      const duplicate = await this.gameRepo.findByName(dto.name);
      if (duplicate && duplicate.id !== id) return false;
    }

    return this.gameRepo.update(id, dto);
  }

  async delete(id: number): Promise<boolean> {
    const current = await this.gameRepo.findById(id);
    if (!current) return false;
    return this.gameRepo.delete(id);
  }

  private toDto(game: Game, activeTournamentsCount?: number): GameDto {
    return new GameDto(
      game.id,
      game.name,
      game.logoUrl || null,
      game.genre || null,
      game.maxPlayerPerTeam,
      activeTournamentsCount,
    );
  }
}
