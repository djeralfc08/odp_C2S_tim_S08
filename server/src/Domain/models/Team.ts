
export class Team{
    constructor(
        public id: number = 0,
        public name: string = "",
        public tag: string ="",
        public logoUrl: string="",
        public description: string="",
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date(),
    ){}
}