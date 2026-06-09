import axios from "axios";
import type { DbNodeHealth, ApiNodeHealth } from "../../types/health";
import { readItem } from "../../helpers/local_storage";
import { apiUrl } from "../../config/api";

const BASE = apiUrl("health");
const authHeader = () => ({ Authorization: `Bearer ${readItem("authToken")}` });
const err = (e: unknown, fallback: string) => ({
  success: false as const,
  message: axios.isAxiosError(e)
    ? (e.response?.data as { message?: string })?.message ?? fallback
    : fallback,
});

export const healthApi = {
  async ping(): Promise<{ success: boolean; message?: string }> {
    return axios.get<{ success: boolean }>(BASE)
      .then(r => r.data).catch(e => err(e, "Server nije dostupan"));
  },
  async getDbHealth(): Promise<{ success: boolean; data?: DbNodeHealth[]; message?: string }> {
    return axios.get<{ success: boolean; data: DbNodeHealth[] }>(`${BASE}/db`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju zdravlja baze"));
  },
  async getApiHealth(): Promise<{ success: boolean; data?: ApiNodeHealth[]; message?: string }> {
    return axios.get<{ success: boolean; data: ApiNodeHealth[] }>(`${BASE}/api`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Greska pri ucitavanju zdravlja API cvorova"));
  },
};
