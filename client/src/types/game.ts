export interface Game {
  id: number;
  name: string;
  logo_url: string | null;
  genre: string | null;
  max_team_size: number;
  active_tournaments_count?: number;
}

export interface CreateGameDto {
  name: string;
  logo_url?: string;
  genre?: string;
  max_team_size: number;
}

export type UpdateGameDto = Partial<CreateGameDto>;
