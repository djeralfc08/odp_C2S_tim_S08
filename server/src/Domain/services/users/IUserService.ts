import { UserDto } from "../../DTOs/users/UserDto";
import { PublicUserDto } from "../../DTOs/users/PublicUserDto";

export interface IUserService {
  getAll(): Promise<UserDto[]>;
  getById(id: number): Promise<UserDto | null>;
  getPublicProfile(id: number): Promise<PublicUserDto | null>;
  deactivate(id: number): Promise<boolean>;
  updateRole(id: number, role: string): Promise<boolean>;
}
