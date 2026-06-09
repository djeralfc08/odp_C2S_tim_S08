import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { IAuthService } from "../../Domain/services/auth/IAuthService";
import { ValidationResult } from "../../Domain/types/ValidationResult";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { validateLogin } from "../validators/auth/validateLogin";
import { validateRegister, RegisterBody } from "../validators/auth/validateRegister";

export class AuthController {
  private readonly router = Router();

  public constructor(private readonly authService: IAuthService) {
    this.router.post("/auth/login", this.login.bind(this));
    this.router.post("/auth/register", this.register.bind(this));
    this.router.post("/auth/logout", authenticate, this.logout.bind(this));
  }

  private async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body as { username?: string; password?: string };
    const v: ValidationResult = validateLogin(username ?? "", password ?? "");
    if (!v.valid) { res.status(400).json({ success: false, message: v.message }); return; }
    const result = await this.authService.login(username!, password!);
    if (result.id === 0) { res.status(401).json({ success: false, message: "Invalid username or password" }); return; }
    const token = jwt.sign(
      { id: result.id, username: result.username, role: result.role },
      process.env.JWT_SECRET ?? "",
      { expiresIn: "24h" }
    );
    res.status(200).json({ success: true, message: "Login successful", data: token });
  }

  private async register(req: Request, res: Response): Promise<void> {
    const body = req.body as RegisterBody & { role?: string };
    const v: ValidationResult = validateRegister(body);
    if (!v.valid) { res.status(400).json({ success: false, message: v.message }); return; }
    const gamerTag = (body.gamer_tag ?? body.username ?? "").trim();
    const result = await this.authService.register(
      gamerTag,
      body.email!.trim(),
      body.password!,
      body.full_name?.trim(),
      body.profile_image ?? null,
    );
    if (result.id === 0) { res.status(409).json({ success: false, message: "Username or email already taken" }); return; }
    const token = jwt.sign(
      { id: result.id, username: result.username, role: result.role },
      process.env.JWT_SECRET ?? "",
      { expiresIn: "24h" }
    );
    res.status(201).json({ success: true, message: "Registration successful", data: token });
  }

  private async logout(req: Request, res: Response): Promise<void> {
    await this.authService.logout(req.user!.id);
    res.status(200).json({ success: true, message: "Logout successful" });
  }

  public getRouter(): Router { return this.router; }
}
