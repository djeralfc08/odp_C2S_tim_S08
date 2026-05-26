import { Game } from "../../models/Game";
import { CreateGameDto, UpdateGameDto } from "../../DTOs/game/CreateGameDto";

export type GameWithStats = { game: Game; activeTournamentsCount: number };

export interface IGameRepository {
  findById(id: number): Promise<Game | null>;
  findByName(name: string): Promise<Game | null>;
  findAll(): Promise<GameWithStats[]>;
  create(dto: CreateGameDto): Promise<Game>;
  update(id: number, dto: UpdateGameDto): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}
