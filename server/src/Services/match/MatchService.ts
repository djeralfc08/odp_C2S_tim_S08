import { IMatchService } from "../../Domain/services/match/IMatchService";
import { IMatchRepository } from "../../Domain/repositories/match/IMatchRepository";
import { Match } from "../../Domain/models/Match";
import { MatchDetailDto } from "../../Domain/DTOs/match/MatchDetailDto";
import { AddMatchPlayerDto } from "../../Domain/DTOs/match/AddMatchPlayerDto";
import { SetMatchResultDto } from "../../Domain/DTOs/match/SetMatchResultDto";

export class MatchService implements IMatchService {
  public constructor(private readonly matchRepo: IMatchRepository) {}

  async getByTournamentId(tournamentId: number): Promise<Match[]> {
    return await this.matchRepo.findByTournamentId(tournamentId);
  }

  async getById(id: number): Promise<MatchDetailDto | null> {
    const match = await this.matchRepo.findById(id);

    if (!match) {
      return null;
    }

    const players = await this.matchRepo.findPlayersByMatchId(id);

    return {
      ...match,
      players
    };
  }

  async getMyMatches(userId: number): Promise<Match[]> {
    return await this.matchRepo.findByUserId(userId);
  }

  
  async setResult(matchId: number, dto: SetMatchResultDto): Promise<boolean> {
  if (!this.isValidScore(dto.score)) {
    return false;
  }

  if (!dto.winner_id || dto.winner_id <= 0) {
    return false;
  }

  const match = await this.matchRepo.findById(matchId);
  if (!match) {
    return false;
  }

  if (match.team1_id !== dto.winner_id && match.team2_id !== dto.winner_id) {
    return false;
  }

  const resultUpdated = await this.matchRepo.updateResult(
    matchId,
    dto.score,
    dto.winner_id
  );

  if (!resultUpdated) {
    return false;
  }

  const nextRound = match.round + 1;
  const nextPosition = Math.ceil(match.match_number / 2);

  const nextMatch = await this.matchRepo.findNextMatch(
    match.tournament_id,
    nextRound,
    nextPosition
  );

  if (!nextMatch) {
    return true;
  }

  const slot = match.match_number % 2 === 1 ? "team1" : "team2";

  await this.matchRepo.advanceWinnerToNextMatch(
    nextMatch.id,
    dto.winner_id,
    slot
  );

  return true;
}
async addPlayer(
  matchId: number,
  currentUserId: number,
  dto: AddMatchPlayerDto
): Promise<boolean> {
  if (!dto.user_id || dto.user_id <= 0) return false;
  if (!dto.team_id || dto.team_id <= 0) return false;

  const match = await this.matchRepo.findById(matchId);
  if (!match) return false;

  if (match.team1_id !== dto.team_id && match.team2_id !== dto.team_id) {
    return false;
  }

  const isCaptain = await this.matchRepo.isUserCaptainOfTeam(currentUserId, dto.team_id);
  if (!isCaptain) return false;

  return await this.matchRepo.addPlayer(
    matchId,
    dto.user_id,
    dto.team_id,
    dto.performance_notes
  );
}

  async updatePlayerNotes(
  matchId: number,
  currentUserId: number,
  userId: number,
  notes: string
): Promise<boolean> {
  if (!userId || userId <= 0) return false;

  const match = await this.matchRepo.findById(matchId);
  if (!match) return false;

  const players = await this.matchRepo.findPlayersByMatchId(matchId);
  const player = players.find((p) => p.user_id === userId);

  if (!player) return false;

  const isCaptain = await this.matchRepo.isUserCaptainOfTeam(currentUserId, player.team_id);
  if (!isCaptain) return false;

  return await this.matchRepo.updatePlayerNotes(matchId, userId, notes);
}

  async removePlayer(
  matchId: number,
  currentUserId: number,
  userId: number
): Promise<boolean> {
  if (!userId || userId <= 0) return false;

  const match = await this.matchRepo.findById(matchId);
  if (!match) return false;

  const players = await this.matchRepo.findPlayersByMatchId(matchId);
  const player = players.find((p) => p.user_id === userId);

  if (!player) return false;

  const isCaptain = await this.matchRepo.isUserCaptainOfTeam(currentUserId, player.team_id);
  if (!isCaptain) return false;

  return await this.matchRepo.removePlayer(matchId, userId);
}


private isValidScore(score: string): boolean {
    return /^\d+:\d+$/.test(score);
}
}