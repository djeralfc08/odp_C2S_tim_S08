import { Match } from "../../models/Match";
import { MatchPlayerDto } from "./MatchPlayerDto";

export interface MatchDetailDto extends Match{
    players: MatchPlayerDto[];
}

