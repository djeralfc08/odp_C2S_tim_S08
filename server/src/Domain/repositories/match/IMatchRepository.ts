import { Match } from "../../../Domain/models/Match";
import { MatchPlayerDto } from "../../../Domain/DTOs/match/MatchPlayerDto";

export interface IMatchRepository {
  findByTournamentId(tournamentId: number): Promise<Match[]>;

  findById(id: number): Promise<Match | null>;

  findPlayersByMatchId(matchId: number): Promise<MatchPlayerDto[]>;

  findByUserId(userId: number): Promise<Match[]>;

  updateResult(matchId: number, score: string, winnerId: number): Promise<boolean>;

  addPlayer(matchId: number, userId: number, teamId: number, notes?: string): Promise<boolean>;

  updatePlayerNotes(matchId: number, userId: number, notes: string): Promise<boolean>;

  removePlayer( matchId: number, userId: number): Promise<boolean>;

  findNextMatch(tournamentId: number, nextRound: number, nextPosition: number): Promise<Match | null>;

  advanceWinnerToNextMatch(nextMatchId: number, winnerId: number, slot: "team1" | "team2"): Promise<boolean>;

  isUserCaptainOfTeam(userId: number, teamId: number): Promise<boolean>;

  deleteByTournamentId(tournamentId: number): Promise<boolean>;

  createBracketMatch(tournamentId: number, round: number, matchNumber: number, team1Id: number | null, team2Id: number | null): Promise<boolean>;
}