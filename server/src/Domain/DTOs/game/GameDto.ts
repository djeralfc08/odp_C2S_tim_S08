export class GameDto {
  constructor(
    public id: number = 0,
    public name: string = "",
    public logo_url: string | null = null,
    public genre: string | null = null,
    public max_team_size: number = 5,
    public active_tournaments_count?: number,
  ) {}
}
