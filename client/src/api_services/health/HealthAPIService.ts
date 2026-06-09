import axios, { type AxiosError } from "axios";
import type { DbNodeHealth, ApiNodeHealth } from "../../types/health";
import { readItem } from "../../helpers/local_storage";
import { apiUrl } from "../../config/api";
import { apiError } from "../../helpers/apiError";

const BASE = apiUrl("health");
const authHeader = () => ({ Authorization: `Bearer ${readItem("authToken")}` });
type ErrBody = { message?: string };

export const healthApi = {
  async ping(): Promise<{ success: boolean; message?: string }> {
    return axios.get<{ success: boolean }>(BASE)
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Server nije dostupan"));
  },
  async getDbHealth(): Promise<{ success: boolean; data?: DbNodeHealth[]; message?: string }> {
    return axios.get<{ success: boolean; data: DbNodeHealth[] }>(`${BASE}/db`, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri ucitavanju zdravlja baze"));
  },
  async getApiHealth(): Promise<{ success: boolean; data?: ApiNodeHealth[]; message?: string }> {
    return axios.get<{ success: boolean; data: ApiNodeHealth[] }>(`${BASE}/api`, { headers: authHeader() })
      .then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri ucitavanju zdravlja API cvorova"));
  },
};
