export class Game {
  constructor(
    public id: number = 0,
    public name: string = "",
    public logoUrl: string = "",
    public genre: string = "",
    public maxPlayerPerTeam: number = 5,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}
}
