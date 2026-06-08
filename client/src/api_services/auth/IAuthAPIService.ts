import type { AuthResponse } from "../../types/auth/AuthResponse";

export interface RegisterPayload {
  gamer_tag: string;
  full_name?: string;
  email: string;
  password: string;
  role: string;
  profile_image?: string | null;
}

export interface IAuthAPIService {
  login(username: string, password: string): Promise<AuthResponse>;
  register(payload: RegisterPayload): Promise<AuthResponse>;
  logout(): Promise<{ success: boolean; message?: string }>;
}
