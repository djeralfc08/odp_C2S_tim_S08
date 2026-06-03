import { CreateTournamentDto, UpdateTournamentDto, TournamentDto } from "../../DTOs/tournament/CreateTournamentDto";
import { TournamentFilters } from "../../repositories/tournament/ITournamentRepository";

export interface ITournamentService {
  getAll(filters?: TournamentFilters): Promise<TournamentDto[]>;
  getById(id: number): Promise<TournamentDto | null>;
  create(dto: CreateTournamentDto): Promise<TournamentDto | null>;
  update(id: number, dto: UpdateTournamentDto): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}