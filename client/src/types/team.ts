export interface Team {
  id: number;
  name: string;
  tag: string;
  logo_url: string | null;
  description: string | null;
  captain_id: number;
  created_at: string;
  member_count?: number;
}

export interface TeamMember {
  user_id: number;
  team_id: number;
  username: string;
  role: 'captain' | 'member';
  joined_at: string;
}

export interface TeamDetail extends Team {
  members: TeamMember[];
}

export interface CreateTeamDto {
  name: string;
  tag: string;
  logo_url?: string;
  description?: string;
}

export type UpdateTeamDto = Partial<CreateTeamDto>;
