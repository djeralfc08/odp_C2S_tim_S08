import bcrypt from "bcryptjs";
import { IAuthService } from "../../Domain/services/auth/IAuthService";
import { IUserRepository } from "../../Domain/repositories/users/IUserRepository";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { AuthUserDto } from "../../Domain/DTOs/auth/AuthUserDto";
import { UserRole } from "../../Domain/enums/UserRole";
import { User } from "../../Domain/models/User";

export class AuthService implements IAuthService {
  private readonly saltRounds = parseInt(process.env.SALT_ROUNDS ?? "10", 10);

  public constructor(
    private readonly userRepo: IUserRepository,
    private readonly auditService: IAuditService,
  ) {}

  async login(username: string, password: string): Promise<AuthUserDto> {
    const user = await this.userRepo.findByUsername(username);
    if (user.id === 0 || user.isActive === 0) return new AuthUserDto();
    const match = await bcrypt.compare(password, user.passwordHash).catch(() => false);
    if (!match) return new AuthUserDto();
    await this.auditService.log(user.id, "LOGIN", "user", user.id);
    return new AuthUserDto(user.id, user.username, user.role);
  }

  async register(
    username: string,
    email: string,
    role: string,
    password: string,
    fullName?: string,
    profileImage?: string | null,
  ): Promise<AuthUserDto> {
    const byName = await this.userRepo.findByUsername(username);
    if (byName.id !== 0) return new AuthUserDto();
    const byEmail = await this.userRepo.findByEmail(email);
    if (byEmail.id !== 0) return new AuthUserDto();
    const hash = await bcrypt.hash(password, this.saltRounds).catch(() => "");
    if (!hash) return new AuthUserDto();
    const userRole = role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.USER;
    const created = await this.userRepo.create(
      new User(
        0,
        username,
        email,
        userRole,
        hash,
        1,
        fullName?.trim() || username,
        profileImage ?? null,
      ),
    );
    if (created.id === 0) return new AuthUserDto();
    await this.auditService.log(created.id, "REGISTER", "user", created.id);
    return new AuthUserDto(created.id, created.username, created.role);
  }

  async logout(userId: number): Promise<void> {
    await this.auditService.log(userId, "LOGOUT", "user", userId);
  }
}
