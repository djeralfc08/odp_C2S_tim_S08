import { Request, Response, Router } from "express";
import { DbManager } from "../../Database/connection/DbConnectionPool";
import { LoadBalancer } from "../../Infrastructure/loadBalancer/LoadBalancer";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";

export class HealthController {
  private readonly router = Router();

  public constructor(
    private readonly db: DbManager,
    private readonly loadBalancer?: LoadBalancer,
  ) {
    this.router.get("/health", this.ping.bind(this));
    this.router.get("/health/check", this.check.bind(this));
    this.router.get(
      "/health/db",
      authenticate,
      authorize(UserRole.ADMIN),
      this.dbHealth.bind(this),
    );
    if (loadBalancer) {
      this.router.get(
        "/health/api",
        authenticate,
        authorize(UserRole.ADMIN),
        this.apiHealth.bind(this),
      );
    }
  }

  private ping(_req: Request, res: Response): void {
    res.status(200).json({ success: true, message: "OK" });
  }

  private check(_req: Request, res: Response): void {
    res.status(200).json({ success: true, message: "OK" });
  }

  private dbHealth(_req: Request, res: Response): void {
    const data = this.db.getNodes().map((n) => ({
      name: n.name,
      host: n.host,
      port: n.port,
      status: n.status,
      latency: n.latencyMs,
      last_check: n.lastCheck.toISOString(),
      role: n.name === "master" || n.name === "master-original" ? "master" : "slave",
      promoted: n.promoted,
      original_role: n.originalRole,
      failover_at: n.failoverAt ? n.failoverAt.toISOString() : null,
    }));
    res.status(200).json({ success: true, data });
  }

  private apiHealth(_req: Request, res: Response): void {
    if (!this.loadBalancer) {
      res.status(503).json({ success: false, message: "Load balancer not available" });
      return;
    }
    const data = this.loadBalancer.getNodes().map((s) => ({
      id: s.id,
      port: s.port,
      url: s.url,
      status: s.status,
      latency: s.latencyMs,
      last_check: s.lastCheck.toISOString(),
    }));
    res.status(200).json({ success: true, data });
  }

  public getRouter(): Router {
    return this.router;
  }
}
