import { Tournament } from "../../models/Tournament";
import { CreateTournamentDto, UpdateTournamentDto } from "../../DTOs/tournament/CreateTournamentDto";

export type TournamentFilters = {
  gameId?: number;
  status?: string;
  format?: string;
};

export interface ITournamentRepository {
  findById(id: number): Promise<Tournament | null>;
  findByName(name: string): Promise<Tournament | null>;
  findAll(filters?: TournamentFilters): Promise<Tournament[]>;
  create(dto: CreateTournamentDto): Promise<Tournament>;
  update(id: number, dto: UpdateTournamentDto): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}
