import { TournamentFormat } from "../../enums/TournamentFormat";
import { TournamentRegistrationStatus } from "../../enums/TournamentRegistrationStatus";

export class CreateTournamentDto {
  constructor(
    public name: string = "",
    public game_id: number = 0,
    public format: TournamentFormat = TournamentFormat.SE,
    public max_teams: number = 8,
    public registration_deadline: string = "",
    public starts_at: string = "",
    public prize_pool: string | null = null,
  ) {}
}

export type UpdateTournamentDto = Partial<CreateTournamentDto> & { status?: string };

export class TournamentDto {
  constructor(
    public id: number = 0,
    public name: string = "",
    public game_id: number = 0,
    public game_name?: string,
    public format: TournamentFormat = TournamentFormat.SE,
    public max_teams: number = 8,
    public registration_deadline: string = "",
    public starts_at: string = "",
    public prize_pool: string | null = null,
    public status: string = "draft",
    public registered_teams_count?: number,
  ) {}
}

export class TournamentRegistrationDto {
  constructor(
    public id: number = 0,
    public tournament_id: number = 0,
    public team_id: number = 0,
    public team_name?: string,
    public team_tag?: string,
    public registered_at: string = "",
    public status: TournamentRegistrationStatus = TournamentRegistrationStatus.PENDING,
    public seed: number | null = null,
  ) {}
}

export type TournamentDetailDto = TournamentDto & {
  registrations: TournamentRegistrationDto[];
};
