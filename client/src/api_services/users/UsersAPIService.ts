import axios from "axios";
import { readItem } from "../../helpers/local_storage";

const BASE = import.meta.env.VITE_API_URL + "users";
const authHeader = () => ({ Authorization: `Bearer ${readItem("authToken")}` });
const err = (e: unknown, fallback: string) => ({
  success: false as const,
  message: axios.isAxiosError(e)
    ? (e.response?.data as { message?: string })?.message ?? fallback
    : fallback,
});

export interface UserDto {
  id: number;
  username: string;
  email: string;
  real_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}

export const usersApi = {
  async getAll(): Promise<{ success: boolean; data?: UserDto[]; message?: string }> {
    return axios.get<{ success: boolean; data: UserDto[] }>(`${BASE}/all`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju korisnika"));
  },
  async getById(id: number): Promise<{ success: boolean; data?: UserDto; message?: string }> {
    return axios.get<{ success: boolean; data: UserDto }>(`${BASE}/${id}`)
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju korisnika"));
  },
  async updateRole(id: number, role: 'user' | 'admin'): Promise<{ success: boolean; message?: string }> {
    return axios.put<{ success: boolean }>(`${BASE}/${id}/role`, { role }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri promeni uloge"));
  },
  async getMe(): Promise<{ success: boolean; data?: UserDto; message?: string }> {
    return axios.get<{ success: boolean; data: UserDto }>(`${BASE}/me`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju profila"));
  },
  async updateProfile(data: { real_name?: string; avatar_url?: string }): Promise<{ success: boolean; message?: string }> {
    return axios.patch<{ success: boolean }>(`${BASE}/me`, data, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri izmeni profila"));
  },
};
