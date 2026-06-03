import { IWatchlistService } from "../../Domain/services/watchlist/IWatchlistService";
import { IWatchlistRepository } from "../../Domain/repositories/watchlist/IWatchlistRepository";
import { ITournamentRepository } from "../../Domain/repositories/tournament/ITournamentRepository";
import { TournamentDto } from "../../Domain/DTOs/tournament/CreateTournamentDto";
import { Tournament } from "../../Domain/models/Tournament";

export class WatchlistService implements IWatchlistService {
  public constructor(
    private readonly watchlistRepo: IWatchlistRepository,
    private readonly tournamentRepo: ITournamentRepository,
  ) {}

  async getByUserId(userId: number): Promise<TournamentDto[]> {
    const rows = await this.watchlistRepo.findTournamentsByUserId(userId);
    return rows.map((t) => this.toDto(t));
  }

  async add(userId: number, tournamentId: number): Promise<boolean> {
    const tournament = await this.tournamentRepo.findById(tournamentId);
    if (!tournament) return false;
    return this.watchlistRepo.add(userId, tournamentId);
  }

  async remove(userId: number, tournamentId: number): Promise<boolean> {
    return this.watchlistRepo.remove(userId, tournamentId);
  }

  private toDto(tournament: Tournament): TournamentDto {
    return new TournamentDto(
      tournament.id,
      tournament.name,
      tournament.gameId,
      tournament.gameName,
      tournament.format,
      tournament.maxTeams,
      tournament.registrationDeadline.toISOString(),
      tournament.startsAt.toISOString(),
      tournament.prizePool,
      tournament.status,
      tournament.registeredTeamsCount,
    );
  }
}
