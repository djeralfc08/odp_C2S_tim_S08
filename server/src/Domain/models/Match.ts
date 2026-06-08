export class Match{
    public constructor(
        public id: number = 0,
        public tournament_id: number = 0,
        public round: number = 1,
        public match_number: number = 0,
        public team1_id: number | null = null,
        public team2_id: number | null = null,
        public winner_id: number | null= null,
        public score: string | null= null,
        public status: "scheduled" | "ongoing" | "completed" = "scheduled",
        public scheduled_at: Date | null = null,
        public next_match_id: number | null= null,
        public tournament_name?: string,
        public team1_name?: string,
        public team2_name?: string

    ){}
}