import axios, { type AxiosError } from "axios";
import type { Game, CreateGameDto, UpdateGameDto } from "../../types/game";
import { readItem } from "../../helpers/local_storage";
import { apiUrl } from "../../config/api";
import { apiError } from "../../helpers/apiError";

const BASE = apiUrl("games");
const authHeader = () => ({ Authorization: `Bearer ${readItem("authToken")}` });
type ErrBody = { message?: string };

export const gamesApi = {
  async getAll(): Promise<{ success: boolean; data?: Game[]; message?: string }> {
    return axios.get<{ success: boolean; data: Game[] }>(BASE)
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri ucitavanju igara"));
  },
  async getById(id: number): Promise<{ success: boolean; data?: Game; message?: string }> {
    return axios.get<{ success: boolean; data: Game }>(`${BASE}/${id}`)
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri ucitavanju igre"));
  },
  async create(dto: CreateGameDto): Promise<{ success: boolean; data?: Game; message?: string }> {
    return axios.post<{ success: boolean; data: Game }>(BASE, dto, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri kreiranju igre"));
  },
  async update(id: number, dto: UpdateGameDto): Promise<{ success: boolean; message?: string }> {
    return axios.put<{ success: boolean }>(`${BASE}/${id}`, dto, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri izmeni igre"));
  },
  async remove(id: number): Promise<{ success: boolean; message?: string }> {
    return axios.delete<{ success: boolean }>(`${BASE}/${id}`, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri brisanju igre"));
  },
};
