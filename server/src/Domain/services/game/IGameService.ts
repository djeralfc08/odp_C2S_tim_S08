import { GameDto } from "../../DTOs/game/GameDto";
import { CreateGameDto, UpdateGameDto } from "../../DTOs/game/CreateGameDto";

export interface IGameService {
  getAll(): Promise<GameDto[]>;
  getById(id: number): Promise<GameDto | null>;
  create(dto: CreateGameDto): Promise<GameDto | null>;
  update(id: number, dto: UpdateGameDto): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}
