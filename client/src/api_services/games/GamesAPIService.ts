import axios from "axios";
import type { Game, CreateGameDto, UpdateGameDto } from "../../types/game";
import { readItem } from "../../helpers/local_storage";
import { apiUrl } from "../../config/api";

const BASE = apiUrl("games");
const authHeader = () => ({ Authorization: `Bearer ${readItem("authToken")}` });
const err = (e: unknown, fallback: string) => ({
  success: false as const,
  message: axios.isAxiosError(e)
    ? (e.response?.data as { message?: string })?.message ?? fallback
    : fallback,
});

export const gamesApi = {
  async getAll(): Promise<{ success: boolean; data?: Game[]; message?: string }> {
    return axios.get<{ success: boolean; data: Game[] }>(BASE)
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju igara"));
  },
  async getById(id: number): Promise<{ success: boolean; data?: Game; message?: string }> {
    return axios.get<{ success: boolean; data: Game }>(`${BASE}/${id}`)
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju igre"));
  },
  async create(dto: CreateGameDto): Promise<{ success: boolean; data?: Game; message?: string }> {
    return axios.post<{ success: boolean; data: Game }>(BASE, dto, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri kreiranju igre"));
  },
  async update(id: number, dto: UpdateGameDto): Promise<{ success: boolean; message?: string }> {
    return axios.put<{ success: boolean }>(`${BASE}/${id}`, dto, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri izmeni igre"));
  },
  async remove(id: number): Promise<{ success: boolean; message?: string }> {
    return axios.delete<{ success: boolean }>(`${BASE}/${id}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri brisanju igre"));
  },
};
