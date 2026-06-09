import { UserRole } from "../../enums/UserRole";

export class ProfileDto {
  constructor(
    public id: number = 0,
    public username: string = "",
    public email: string = "",
    public role: UserRole = UserRole.USER,
    public is_active: number = 1,
    public real_name: string | null = null,
    public avatar_url: string | null = null,
  ) {}
}
