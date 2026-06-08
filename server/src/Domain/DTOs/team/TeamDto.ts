export class TeamDto{
    constructor(
        public id: number,
        public name: string,
        public tag: string,
        public logoUrl: string | null,
        public description: string | null,
        public membersCount?: number,
        public captainId?: number | null,
        public captainUsername?: string | null,

    ){}
}