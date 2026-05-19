import axios from "axios";
import type { Team, TeamDetail, CreateTeamDto, UpdateTeamDto } from "../../types/team";
import { readItem } from "../../helpers/local_storage";

const BASE = import.meta.env.VITE_API_URL + "teams";
const authHeader = () => ({ Authorization: `Bearer ${readItem("authToken")}` });
const err = (e: unknown, fallback: string) => ({
  success: false as const,
  message: axios.isAxiosError(e)
    ? (e.response?.data as { message?: string })?.message ?? fallback
    : fallback,
});

export const teamsApi = {
  async getMyTeams(): Promise<{ success: boolean; data?: Team[]; message?: string }> {
    return axios.get<{ success: boolean; data: Team[] }>(BASE, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju timova"));
  },
  async getById(id: number): Promise<{ success: boolean; data?: TeamDetail; message?: string }> {
    return axios.get<{ success: boolean; data: TeamDetail }>(`${BASE}/${id}`)
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju tima"));
  },
  async create(dto: CreateTeamDto): Promise<{ success: boolean; data?: Team; message?: string }> {
    return axios.post<{ success: boolean; data: Team }>(BASE, dto, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri kreiranju tima"));
  },
  async update(id: number, dto: UpdateTeamDto): Promise<{ success: boolean; message?: string }> {
    return axios.put<{ success: boolean }>(`${BASE}/${id}`, dto, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri izmeni tima"));
  },
  async remove(id: number): Promise<{ success: boolean; message?: string }> {
    return axios.delete<{ success: boolean }>(`${BASE}/${id}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri brisanju tima"));
  },
  async invite(teamId: number, gamerTag: string): Promise<{ success: boolean; message?: string }> {
    return axios.post<{ success: boolean }>(`${BASE}/${teamId}/invite`, { gamer_tag: gamerTag }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri slanju pozivnice"));
  },
  async respondInvite(teamId: number, accept: boolean): Promise<{ success: boolean; message?: string }> {
    return axios.post<{ success: boolean }>(`${BASE}/${teamId}/invite/respond`, { accept }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri odgovoru na pozivnicu"));
  },
  async updateMemberRole(teamId: number, userId: number, role: 'captain' | 'member'): Promise<{ success: boolean; message?: string }> {
    return axios.patch<{ success: boolean }>(`${BASE}/${teamId}/members/${userId}/role`, { role }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri promeni uloge"));
  },
  async removeMember(teamId: number, userId: number): Promise<{ success: boolean; message?: string }> {
    return axios.delete<{ success: boolean }>(`${BASE}/${teamId}/members/${userId}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri uklanjanju clana"));
  },
};
