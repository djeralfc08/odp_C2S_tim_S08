import { Match } from "../../models/Match";


export interface AddMatchPlayerDto{
    user_id: number,
    team_id: number;
    performance_notes?: string;

}