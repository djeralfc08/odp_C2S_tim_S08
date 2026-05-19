import axios from "axios";
import type {
  Tournament, TournamentDetail, TournamentRegistration,
  CreateTournamentDto, UpdateTournamentDto, RegistrationStatus,
} from "../../types/tournament";
import { readItem } from "../../helpers/local_storage";

const BASE = import.meta.env.VITE_API_URL + "tournaments";
const authHeader = () => ({ Authorization: `Bearer ${readItem("authToken")}` });
const err = (e: unknown, fallback: string) => ({
  success: false as const,
  message: axios.isAxiosError(e)
    ? (e.response?.data as { message?: string })?.message ?? fallback
    : fallback,
});

export const tournamentsApi = {
  async getAll(params?: { game_id?: number; status?: string; format?: string }): Promise<{ success: boolean; data?: Tournament[]; message?: string }> {
    return axios.get<{ success: boolean; data: Tournament[] }>(BASE, { params })
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju turnira"));
  },
  async getById(id: number): Promise<{ success: boolean; data?: TournamentDetail; message?: string }> {
    return axios.get<{ success: boolean; data: TournamentDetail }>(`${BASE}/${id}`)
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju turnira"));
  },
  async create(dto: CreateTournamentDto): Promise<{ success: boolean; data?: Tournament; message?: string }> {
    return axios.post<{ success: boolean; data: Tournament }>(BASE, dto, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri kreiranju turnira"));
  },
  async update(id: number, dto: UpdateTournamentDto): Promise<{ success: boolean; message?: string }> {
    return axios.put<{ success: boolean }>(`${BASE}/${id}`, dto, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri izmeni turnira"));
  },
  async remove(id: number): Promise<{ success: boolean; message?: string }> {
    return axios.delete<{ success: boolean }>(`${BASE}/${id}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri brisanju turnira"));
  },
  async register(tournamentId: number, teamId: number): Promise<{ success: boolean; message?: string }> {
    return axios.post<{ success: boolean }>(`${BASE}/${tournamentId}/register`, { team_id: teamId }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri prijavi na turnir"));
  },
  async unregister(tournamentId: number, teamId: number): Promise<{ success: boolean; message?: string }> {
    return axios.delete<{ success: boolean }>(`${BASE}/${tournamentId}/register/${teamId}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri odjavi sa turnira"));
  },
  async updateRegistration(tournamentId: number, teamId: number, status: RegistrationStatus): Promise<{ success: boolean; message?: string }> {
    return axios.patch<{ success: boolean }>(`${BASE}/${tournamentId}/registrations/${teamId}`, { status }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri azuriranju prijave"));
  },
  async generateBracket(tournamentId: number): Promise<{ success: boolean; message?: string }> {
    return axios.post<{ success: boolean }>(`${BASE}/${tournamentId}/generate-bracket`, {}, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri generisanju rasporeda"));
  },
  async addToWatchlist(tournamentId: number): Promise<{ success: boolean; message?: string }> {
    return axios.post<{ success: boolean }>(`${BASE}/${tournamentId}/watch`, {}, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri dodavanju na watchlist"));
  },
  async removeFromWatchlist(tournamentId: number): Promise<{ success: boolean; message?: string }> {
    return axios.delete<{ success: boolean }>(`${BASE}/${tournamentId}/watch`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri uklanjanju sa watchliste"));
  },
  async getWatchlist(): Promise<{ success: boolean; data?: Tournament[]; message?: string }> {
    return axios.get<{ success: boolean; data: Tournament[] }>(`${BASE}/watchlist`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju watchliste"));
  },
  async getRegistrations(tournamentId: number): Promise<{ success: boolean; data?: TournamentRegistration[]; message?: string }> {
    return axios.get<{ success: boolean; data: TournamentRegistration[] }>(`${BASE}/${tournamentId}/registrations`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju prijava"));
  },
};
