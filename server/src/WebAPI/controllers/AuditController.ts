import { Request, Response, Router } from "express";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";

export class AuditController {
  private readonly router = Router();

  public constructor(
    private readonly auditService: IAuditService
  ) {
    this.router.get(
      "/audits/logs",
      authenticate,
      authorize(UserRole.ADMIN),
      this.getAll.bind(this)
    );
  }

  private async getAll(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);

    const logs = await this.auditService.getAll(page, pageSize);

    res.status(200).json({
      success: true,
      data: logs
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}