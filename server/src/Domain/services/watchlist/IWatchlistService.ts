import { TournamentDto } from "../../DTOs/tournament/CreateTournamentDto";

export interface IWatchlistService {
  getByUserId(userId: number): Promise<TournamentDto[]>;
  add(userId: number, tournamentId: number): Promise<boolean>;
  remove(userId: number, tournamentId: number): Promise<boolean>;
}
