export type MatchStatus = 'scheduled' | 'ongoing' | 'completed';

export interface Match {
  id: number;
  tournament_id: number;
  tournament_name?: string;
  round: number;
  match_number: number;
  team1_id: number | null;
  team2_id: number | null;
  team1_name?: string;
  team2_name?: string;
  winner_id: number | null;
  score: string | null;
  status: MatchStatus;
  scheduled_at: string | null;
  next_match_id: number | null;
}

export interface MatchPlayer {
  match_id: number;
  user_id: number;
  team_id: number;
  username?: string;
  performance_notes: string | null;
}

export interface MatchDetail extends Match {
  players: MatchPlayer[];
}

export interface SetMatchResultDto {
  score: string;
  winner_id: number;
}

export interface AddMatchPlayerDto {
  user_id: number;
  team_id: number;
  performance_notes?: string;
}
