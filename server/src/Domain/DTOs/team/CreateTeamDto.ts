export class CreateTeamDto{
    constructor(
        public name: string,
        public tag: string,
        public logoUrl?: string | null,
        public description?: string | null,
    ){}
}

export class UpdateTeamDto{
    constructor(
        public name?: string,
        public tag?: string,
        public logoUrl?: string | null,
        public description?: string | null,
    ){}
}