import { AuthUserDto } from "../../DTOs/auth/AuthUserDto";

export interface IAuthService {
  login(username: string, password: string): Promise<AuthUserDto>;
  register(
    username: string,
    email: string,
    role: string,
    password: string,
    fullName?: string,
    profileImage?: string | null,
  ): Promise<AuthUserDto>;
  logout(userId: number): Promise<void>;
}
