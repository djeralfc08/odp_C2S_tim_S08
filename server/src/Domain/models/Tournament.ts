import { TournamentFormat } from "../enums/TournamentFormat";

export class Tournament {
  constructor(
    public id: number = 0,
    public gameId: number = 0,
    public name: string = "",
    public format: TournamentFormat = TournamentFormat.SE,
    public maxTeams: number = 8,
    public registrationDeadline: Date = new Date(),
    public startsAt: Date = new Date(),
    public endsAt: Date | null = null,
    public prizePool: string | null = null,
    public status: string = "draft",
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public gameName?: string,
    public registeredTeamsCount?: number,
  ) {}
}
