import { Tournament } from "../../models/Tournament";

export interface IWatchlistRepository {
  findTournamentsByUserId(userId: number): Promise<Tournament[]>;
  add(userId: number, tournamentId: number): Promise<boolean>;
  remove(userId: number, tournamentId: number): Promise<boolean>;
}
