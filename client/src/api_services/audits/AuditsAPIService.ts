import axios, { type AxiosError } from "axios";
import type { PaginatedAuditLogs } from "../../types/audit";
import { readItem } from "../../helpers/local_storage";
import { apiUrl } from "../../config/api";
import { apiError } from "../../helpers/apiError";

const BASE = apiUrl("audits");
const authHeader = () => ({ Authorization: `Bearer ${readItem("authToken")}` });
type ErrBody = { message?: string };

export const auditsApi = {
  async getLogs(page = 1, limit = 20): Promise<{ success: boolean; data?: PaginatedAuditLogs; message?: string }> {
    return axios.get<{ success: boolean; data: PaginatedAuditLogs }>(`${BASE}/logs`, {
      headers: authHeader(),
      params: { page, limit },
    }).then(r => r.data).catch((e: AxiosError<ErrBody>) => apiError(e, "Greska pri ucitavanju audit loga"));
  },
};
