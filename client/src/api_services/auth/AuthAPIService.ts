import axios from "axios";
import type { AuthResponse } from "../../types/auth/AuthResponse";
import type { IAuthAPIService, RegisterPayload } from "./IAuthAPIService";
import { readItem } from "../../helpers/local_storage";
import { apiUrl } from "../../config/api";

const BASE = apiUrl("auth");
const authHeader = () => ({ Authorization: `Bearer ${readItem("authToken")}` });
const err = (e: unknown, fallback: string): AuthResponse => ({
  success: false,
  message: axios.isAxiosError(e) ? (e.response?.data as { message?: string })?.message ?? fallback : fallback,
});

export const authApi: IAuthAPIService = {
  async login(username, password) {
    return axios.post<AuthResponse>(`${BASE}/login`, { username, password })
      .then(r => r.data).catch(e => err(e, "Login failed"));
  },
  async register(payload: RegisterPayload) {
    return axios.post<AuthResponse>(`${BASE}/register`, {
      gamer_tag: payload.gamer_tag,
      username: payload.gamer_tag,
      full_name: payload.full_name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      profile_image: payload.profile_image ?? null,
    })
      .then(r => r.data).catch(e => err(e, "Registration failed"));
  },
  async logout() {
    return axios.post<{ success: boolean; message?: string }>(`${BASE}/logout`, {}, { headers: authHeader() })
      .then(r => r.data).catch(e => ({
        success: false,
        message: axios.isAxiosError(e) ? (e.response?.data as { message?: string })?.message ?? "Logout failed" : "Logout failed",
      }));
  },
};
