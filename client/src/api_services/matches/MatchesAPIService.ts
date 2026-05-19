import axios from "axios";
import type { Match, MatchDetail, SetMatchResultDto, AddMatchPlayerDto } from "../../types/match";
import { readItem } from "../../helpers/local_storage";

const BASE = import.meta.env.VITE_API_URL + "matches";
const authHeader = () => ({ Authorization: `Bearer ${readItem("authToken")}` });
const err = (e: unknown, fallback: string) => ({
  success: false as const,
  message: axios.isAxiosError(e)
    ? (e.response?.data as { message?: string })?.message ?? fallback
    : fallback,
});

export const matchesApi = {
  async getByTournament(tournamentId: number): Promise<{ success: boolean; data?: Match[]; message?: string }> {
    return axios.get<{ success: boolean; data: Match[] }>(`${BASE}/tournament/${tournamentId}`)
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju meceva"));
  },
  async getById(id: number): Promise<{ success: boolean; data?: MatchDetail; message?: string }> {
    return axios.get<{ success: boolean; data: MatchDetail }>(`${BASE}/${id}`)
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju meca"));
  },
  async getMyMatches(): Promise<{ success: boolean; data?: Match[]; message?: string }> {
    return axios.get<{ success: boolean; data: Match[] }>(`${BASE}/my`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju mojih meceva"));
  },
  async setResult(id: number, dto: SetMatchResultDto): Promise<{ success: boolean; message?: string }> {
    return axios.patch<{ success: boolean }>(`${BASE}/${id}/result`, dto, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri unosu rezultata"));
  },
  async addPlayer(matchId: number, dto: AddMatchPlayerDto): Promise<{ success: boolean; message?: string }> {
    return axios.post<{ success: boolean }>(`${BASE}/${matchId}/players`, dto, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri dodavanju igraca"));
  },
  async updatePlayerNotes(matchId: number, userId: number, notes: string): Promise<{ success: boolean; message?: string }> {
    return axios.put<{ success: boolean }>(`${BASE}/${matchId}/players/${userId}`, { performance_notes: notes }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri izmeni beleski"));
  },
  async removePlayer(matchId: number, userId: number): Promise<{ success: boolean; message?: string }> {
    return axios.delete<{ success: boolean }>(`${BASE}/${matchId}/players/${userId}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri uklanjanju igraca"));
  },
};
