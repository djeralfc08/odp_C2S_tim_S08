export class CreateGameDto {
  constructor(
    public name: string = "",
    public logo_url?: string,
    public genre?: string,
    public max_team_size: number = 5,
  ) {}
}
export type UpdateGameDto = Partial<CreateGameDto>;

