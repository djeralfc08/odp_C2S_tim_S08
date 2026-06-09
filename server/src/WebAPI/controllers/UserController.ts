import { Request, Response, Router } from "express";
import { IUserService } from "../../Domain/services/users/IUserService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";

export class UserController {
  private readonly router = Router();

  public constructor(private readonly userService: IUserService) {
    this.router.get("/users", authenticate, authorize(UserRole.ADMIN), this.getAll.bind(this));
    this.router.get("/users/me", authenticate, this.getMe.bind(this));
    this.router.patch("/users/me", authenticate, this.updateMe.bind(this));
    this.router.put("/users/:id/role", authenticate, authorize(UserRole.ADMIN), this.updateRole.bind(this));
    this.router.get("/users/:id", this.getPublicProfile.bind(this));
    this.router.patch("/users/:id/deactivate", authenticate, authorize(UserRole.ADMIN), this.deactivate.bind(this));
  }

  private async getMe(req: Request, res: Response): Promise<void> {
    const profile = await this.userService.getProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.status(200).json({ success: true, data: profile });
  }

  private async updateMe(req: Request, res: Response): Promise<void> {
    const body = req.body ?? {};
    const realName = typeof body.real_name === "string" ? body.real_name : undefined;
    const avatarUrl = body.avatar_url !== undefined
      ? (typeof body.avatar_url === "string" ? body.avatar_url : null)
      : undefined;

    const ok = await this.userService.updateProfile(req.user!.id, realName, avatarUrl);
    if (!ok) {
      res.status(400).json({ success: false, message: "Profile could not be updated" });
      return;
    }
    res.status(200).json({ success: true, message: "Profile updated" });
  }

  private async getAll(req: Request, res: Response): Promise<void> {
    const users = await this.userService.getAll();
    res.status(200).json({ success: true, data: users });
  }

  private async getPublicProfile(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const user = await this.userService.getPublicProfile(id);
    if (!user) { res.status(404).json({ success: false, message: "User not found" }); return; }
    res.status(200).json({ success: true, data: user });
  }

  private async deactivate(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const ok = await this.userService.deactivate(id);
    res.status(ok ? 200 : 500).json({ success: ok, message: ok ? "User deactivated" : "Failed to deactivate user" });
  }

  private async updateRole(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);

    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid id" });
      return;
    }

    const role = req.body?.role;

    if (typeof role !== "string") {
      res.status(400).json({ success: false, message: "Role is required" });
      return;
    }

    const ok = await this.userService.updateRole(id, role);

    if (!ok) {
      res.status(400).json({ success: false, message: "Role could not be updated" });
      return;
    }

    res.status(200).json({ success: true });
  }

  public getRouter(): Router { return this.router; }
}
