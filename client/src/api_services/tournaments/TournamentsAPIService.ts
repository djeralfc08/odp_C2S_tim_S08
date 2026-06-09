import axios, { type AxiosError } from "axios";
import type {
  Tournament, TournamentDetail, TournamentRegistration,
  CreateTournamentDto, UpdateTournamentDto, RegistrationStatus,
} from "../../types/tournament";
import { readItem } from "../../helpers/local_storage";
import { apiUrl } from "../../config/api";
import { apiError } from "../../helpers/apiError";

const BASE = apiUrl("tournaments");
const authHeader = () => ({ Authorization: `Bearer ${readItem("authToken")}` });
type ErrBody = { message?: string };

export const tournamentsApi = {
  async getAll(params?: { game_id?: number; status?: string; format?: string; fresh?: boolean }): Promise<{ success: boolean; data?: Tournament[]; message?: string }> {
    return axios.get<{ success: boolean; data: Tournament[] }>(BASE, { params })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri ucitavanju turnira"));
  },
  async getById(id: number): Promise<{ success: boolean; data?: TournamentDetail; message?: string }> {
    return axios.get<{ success: boolean; data: TournamentDetail }>(`${BASE}/${id}`)
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri ucitavanju turnira"));
  },
  async create(dto: CreateTournamentDto): Promise<{ success: boolean; data?: Tournament; message?: string }> {
    return axios.post<{ success: boolean; data: Tournament }>(BASE, dto, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri kreiranju turnira"));
  },
  async update(id: number, dto: UpdateTournamentDto): Promise<{ success: boolean; data?: Tournament; message?: string }> {
    return axios.put<{ success: boolean; data?: Tournament }>(`${BASE}/${id}`, dto, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri izmeni turnira"));
  },
  async remove(id: number): Promise<{ success: boolean; message?: string }> {
    return axios.delete<{ success: boolean }>(`${BASE}/${id}`, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri brisanju turnira"));
  },
  async register(tournamentId: number, teamId: number): Promise<{ success: boolean; message?: string }> {
    return axios.post<{ success: boolean }>(`${BASE}/${tournamentId}/register`, { team_id: teamId }, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri prijavi na turnir"));
  },
  async unregister(tournamentId: number, teamId: number): Promise<{ success: boolean; message?: string }> {
    return axios.delete<{ success: boolean }>(`${BASE}/${tournamentId}/register/${teamId}`, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri odjavi sa turnira"));
  },
  async updateRegistration(tournamentId: number, teamId: number, status: RegistrationStatus): Promise<{ success: boolean; message?: string }> {
    return axios.patch<{ success: boolean }>(`${BASE}/${tournamentId}/registrations/${teamId}`, { status }, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri azuriranju prijave"));
  },
  async generateBracket(tournamentId: number): Promise<{ success: boolean; message?: string }> {
    return axios.post<{ success: boolean }>(`${BASE}/${tournamentId}/generate-bracket`, {}, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri generisanju rasporeda"));
  },
  async addToWatchlist(tournamentId: number): Promise<{ success: boolean; message?: string }> {
    return axios.post<{ success: boolean }>(`${BASE}/${tournamentId}/watch`, {}, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri dodavanju na watchlist"));
  },
  async removeFromWatchlist(tournamentId: number): Promise<{ success: boolean; message?: string }> {
    return axios.delete<{ success: boolean }>(`${BASE}/${tournamentId}/watch`, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri uklanjanju sa watchliste"));
  },
  async getWatchlist(): Promise<{ success: boolean; data?: Tournament[]; message?: string }> {
    return axios.get<{ success: boolean; data: Tournament[] }>(`${BASE}/watchlist`, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri ucitavanju watchliste"));
  },
  async getRegistrations(tournamentId: number): Promise<{ success: boolean; data?: TournamentRegistration[]; message?: string }> {
    return axios.get<{ success: boolean; data: TournamentRegistration[] }>(`${BASE}/${tournamentId}/registrations`, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri ucitavanju prijava"));
  },
};
