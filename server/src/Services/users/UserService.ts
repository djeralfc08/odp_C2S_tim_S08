import { IUserService } from "../../Domain/services/users/IUserService";
import { IUserRepository } from "../../Domain/repositories/users/IUserRepository";
import { UserDto } from "../../Domain/DTOs/users/UserDto";
import { PublicUserDto } from "../../Domain/DTOs/users/PublicUserDto";
import { UserRole } from "../../Domain/enums/UserRole";

export class UserService implements IUserService {
  public constructor(private readonly userRepo: IUserRepository) {}

  async getAll(): Promise<UserDto[]> {
    const users = await this.userRepo.findAll();
    return users.map((u) => new UserDto(u.id, u.username, u.email, u.role, u.isActive));
  }

  async getById(id: number): Promise<UserDto | null> {
    const u = await this.userRepo.findById(id);
    if (u.id === 0) return null;
    return new UserDto(u.id, u.username, u.email, u.role, u.isActive);
  }

  async getPublicProfile(id: number): Promise<PublicUserDto | null> {
    return this.userRepo.findPublicById(id);
  }

  async deactivate(id: number): Promise<boolean> {
    return this.userRepo.deactivate(id);
  }


  async updateRole(id: number, role: string): Promise<boolean> {
  if (!Object.values(UserRole).includes(role as UserRole)) {
    return false;
  }

  const user = await this.userRepo.findById(id);
  if (user.id === 0) return false;

  return await this.userRepo.updateRole(id, role);
}
}
