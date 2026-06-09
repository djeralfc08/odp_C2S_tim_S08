import type { AxiosError } from "axios";

type ApiErrorBody = { message?: string };

export function apiError(e: AxiosError<ApiErrorBody>, fallback: string) {
  return {
    success: false as const,
    message: e.response?.data?.message ?? fallback,
  };
}
