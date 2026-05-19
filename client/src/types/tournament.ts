export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin';
export type TournamentStatus = 'upcoming' | 'registration' | 'ongoing' | 'completed' | 'cancelled';
export type RegistrationStatus = 'pending' | 'confirmed' | 'disqualified';

export interface Tournament {
  id: number;
  name: string;
  game_id: number;
  game_name?: string;
  game_logo?: string;
  format: TournamentFormat;
  max_teams: number;
  registration_deadline: string;
  start_date: string;
  prize_pool: string | null;
  status: TournamentStatus;
  created_by: number;
  registered_teams_count?: number;
}

export interface TournamentRegistration {
  id: number;
  tournament_id: number;
  team_id: number;
  team_name?: string;
  team_tag?: string;
  registered_at: string;
  status: RegistrationStatus;
  seed: number | null;
}

export interface TournamentDetail extends Tournament {
  registrations: TournamentRegistration[];
}

export interface CreateTournamentDto {
  name: string;
  game_id: number;
  format: TournamentFormat;
  max_teams: number;
  registration_deadline: string;
  start_date: string;
  prize_pool?: string;
}

export type UpdateTournamentDto = Partial<CreateTournamentDto>;
