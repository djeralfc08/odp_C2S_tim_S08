import { Match } from "../../models/Match";
import { MatchDetailDto } from "../../DTOs/match/MatchDetailDto";
import { AddMatchPlayerDto } from "../../DTOs/match/AddMatchPlayerDto";
import { SetMatchResultDto } from "../../DTOs/match/SetMatchResultDto";

export interface IMatchService {
  getByTournamentId(tournamentId: number): Promise<Match[]>;

  getById(id: number): Promise<MatchDetailDto | null>;

  getMyMatches(userId: number): Promise<Match[]>;

  setResult(matchId: number, userId: number, dto: SetMatchResultDto): Promise<boolean>;

  addPlayer(matchId: number, currentUserId: number, dto: AddMatchPlayerDto): Promise<boolean>;

  updatePlayerNotes(matchId: number, currentUserId: number, userId: number, notes: string): Promise<boolean>;

  removePlayer(matchId: number, currentUserId: number, userId: number): Promise<boolean>;
}