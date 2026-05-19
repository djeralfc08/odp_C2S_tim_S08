import axios from "axios";
import type { PaginatedAuditLogs } from "../../types/audit";
import { readItem } from "../../helpers/local_storage";

const BASE = import.meta.env.VITE_API_URL + "audits";
const authHeader = () => ({ Authorization: `Bearer ${readItem("authToken")}` });
const err = (e: unknown, fallback: string) => ({
  success: false as const,
  message: axios.isAxiosError(e)
    ? (e.response?.data as { message?: string })?.message ?? fallback
    : fallback,
});

export const auditsApi = {
  async getLogs(page = 1, limit = 20): Promise<{ success: boolean; data?: PaginatedAuditLogs; message?: string }> {
    return axios.get<{ success: boolean; data: PaginatedAuditLogs }>(`${BASE}/logs`, {
      headers: authHeader(),
      params: { page, limit },
    }).then(r => r.data).catch(e => err(e, "Greska pri ucitavanju audit loga"));
  },
};
