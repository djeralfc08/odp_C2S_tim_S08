import { UserDto } from "../../DTOs/users/UserDto";
import { PublicUserDto } from "../../DTOs/users/PublicUserDto";
import { ProfileDto } from "../../DTOs/users/ProfileDto";

export interface IUserService {
  getAll(): Promise<UserDto[]>;
  getById(id: number): Promise<UserDto | null>;
  getProfile(id: number): Promise<ProfileDto | null>;
  getPublicProfile(id: number): Promise<PublicUserDto | null>;
  deactivate(id: number): Promise<boolean>;
  updateRole(id: number, role: string): Promise<boolean>;
  updateProfile(id: number, realName?: string, avatarUrl?: string | null): Promise<boolean>;
}
