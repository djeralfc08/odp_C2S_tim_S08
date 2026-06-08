import { User } from "../../models/User";
import { PublicUserDto } from "../../DTOs/users/PublicUserDto";

export interface IUserRepository {
  findById(id: number): Promise<User>;
  findPublicById(id: number): Promise<PublicUserDto | null>;
  findByUsername(username: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  findAll(): Promise<User[]>;
  create(user: User): Promise<User>;
  update(user: User): Promise<boolean>;
  deactivate(id: number): Promise<boolean>;
  updateRole(id: number, role: string): Promise<boolean>;
}
