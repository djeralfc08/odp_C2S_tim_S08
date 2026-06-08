import { Match } from "../../models/Match";

export interface MatchPlayerDto{
    match_id: number;
    user_id: number;
    team_id: number;
    username?: string;
    performance_notes: string | null;
}

