import axios, { type AxiosError } from "axios";
import { readItem } from "../../helpers/local_storage";
import { apiUrl } from "../../config/api";
import { apiError } from "../../helpers/apiError";

const BASE = apiUrl("users");
const authHeader = () => ({ Authorization: `Bearer ${readItem("authToken")}` });
type ErrBody = { message?: string };

export interface UserDto {
  id: number;
  username?: string;
  gamer_tag?: string;
  email?: string;
  full_name?: string;
  real_name?: string | null;
  profile_image?: string | null;
  avatar_url?: string | null;
  role?: 'user' | 'admin';
  is_active?: boolean;
  created_at?: string;
}

export const usersApi = {
  async getAll(): Promise<{ success: boolean; data?: UserDto[]; message?: string }> {
    return axios.get<{ success: boolean; data: UserDto[] }>(`${BASE}`, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri ucitavanju korisnika"));
  },
  async getById(id: number): Promise<{ success: boolean; data?: UserDto; message?: string }> {
    return axios.get<{ success: boolean; data: UserDto }>(`${BASE}/${id}`)
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri ucitavanju korisnika"));
  },
  async updateRole(id: number, role: 'user' | 'admin'): Promise<{ success: boolean; message?: string }> {
    return axios.put<{ success: boolean }>(`${BASE}/${id}/role`, { role }, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri promeni uloge"));
  },
  async getMe(): Promise<{ success: boolean; data?: UserDto; message?: string }> {
    return axios.get<{ success: boolean; data: UserDto }>(`${BASE}/me`, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri ucitavanju profila"));
  },
  async updateProfile(data: { real_name?: string; avatar_url?: string }): Promise<{ success: boolean; message?: string }> {
    return axios.patch<{ success: boolean }>(`${BASE}/me`, data, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri izmeni profila"));
  },
};
