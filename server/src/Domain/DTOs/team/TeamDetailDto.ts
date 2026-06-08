export interface TeamMemberDto {
  user_id: number;
  team_id: number;
  username: string;
  role: "captain" | "member";
  joined_at: Date;
}

export interface TeamDetailDto {
  id: number;
  name: string;
  tag: string;
  logo_url: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  members: TeamMemberDto[];
}