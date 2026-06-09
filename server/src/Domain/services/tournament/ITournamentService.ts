import { CreateTournamentDto, UpdateTournamentDto, TournamentDto } from "../../DTOs/tournament/CreateTournamentDto";
import { TournamentFilters } from "../../repositories/tournament/ITournamentRepository";

export interface ITournamentService {
  getAll(filters?: TournamentFilters): Promise<TournamentDto[]>;
  getById(id: number): Promise<TournamentDto | null>;
  create(userId: number, dto: CreateTournamentDto): Promise<TournamentDto | null>;
  update(userId: number, id: number, dto: UpdateTournamentDto): Promise<boolean>;
  delete(userId: number, id: number): Promise<boolean>;
}