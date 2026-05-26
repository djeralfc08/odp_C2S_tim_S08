import { createHash } from "crypto";
import { NodeStatus } from "../../Domain/enums/NodeStatus";
import {
  DEGRADED_LATENCY_MS,
  HEALTH_CHECK_INTERVAL_MS,
  HEALTH_CHECK_TIMEOUT,
} from "../../Domain/constants/Constants";
import { ILoggerService } from "../../Domain/services/logger/ILoggerService";
import { ApiServer } from "./ApiServer";

export type LbStrategy =
  | "round_robin"
  | "weighted"
  | "least_connections"
  | "ip_hash";

function parseServers(): { url: string; port: number; weight: number }[] {
  const raw = process.env.API_SERVERS ?? "http://localhost:3001,http://localhost:3002,http://localhost:3003";
  const weights = (process.env.API_SERVER_WEIGHTS ?? "")
    .split(",")
    .map((w) => parseInt(w.trim(), 10))
    .filter((w) => !Number.isNaN(w));

  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((url, i) => {
      const parsed = new URL(url.startsWith("http") ? url : `http://${url}`);
      return {
        url: `${parsed.protocol}//${parsed.host}`,
        port: parsed.port ? parseInt(parsed.port, 10) : 80,
        weight: weights[i] ?? 1,
      };
    });
}

export class LoadBalancer {
  private readonly servers: ApiServer[];
  private readonly strategy: LbStrategy;
  private rrIndex = 0;
  private weightedIndex = 0;
  private healthTimer: NodeJS.Timeout | null = null;

  public constructor(private readonly logger: ILoggerService) {
    const entries = parseServers();
    this.servers = entries.map(
      (e, i) => new ApiServer(i + 1, e.url, e.port, e.weight),
    );
    const s = (process.env.LB_STRATEGY ?? "round_robin").toLowerCase();
    this.strategy = (
      ["round_robin", "weighted", "least_connections", "ip_hash"].includes(s)
        ? s
        : "round_robin"
    ) as LbStrategy;
  }

  public getNodes(): ApiServer[] {
    return [...this.servers];
  }

  public incrementConnections(server: ApiServer): void {
    server.activeConnections++;
  }

  public decrementConnections(server: ApiServer): void {
    server.activeConnections = Math.max(0, server.activeConnections - 1);
  }

  private eligible(preferHealthy = true): ApiServer[] {
    const healthy = this.servers.filter((s) => s.status === NodeStatus.HEALTHY);
    if (healthy.length > 0) return healthy;
    if (!preferHealthy) return [];
    const degraded = this.servers.filter((s) => s.status === NodeStatus.DEGRADED);
    return degraded.length > 0 ? degraded : [];
  }

  public pickServer(clientIp?: string): ApiServer | null {
    const pool = this.eligible();
    if (pool.length === 0) return null;

    switch (this.strategy) {
      case "weighted":
        return this.pickWeighted(pool);
      case "least_connections":
        return pool.reduce((a, b) =>
          a.activeConnections <= b.activeConnections ? a : b,
        );
      case "ip_hash": {
        const ip = clientIp ?? "0.0.0.0";
        const hash = createHash("md5").update(ip).digest();
        const idx = hash.readUInt32BE(0) % pool.length;
        return pool[idx];
      }
      case "round_robin":
      default:
        return this.pickRoundRobin(pool);
    }
  }

  private pickRoundRobin(pool: ApiServer[]): ApiServer {
    const server = pool[this.rrIndex % pool.length];
    this.rrIndex = (this.rrIndex + 1) % pool.length;
    return server;
  }

  private pickWeighted(pool: ApiServer[]): ApiServer {
    const expanded: ApiServer[] = [];
    for (const s of pool) {
      for (let i = 0; i < s.weight; i++) expanded.push(s);
    }
    const server = expanded[this.weightedIndex % expanded.length];
    this.weightedIndex = (this.weightedIndex + 1) % expanded.length;
    return server;
  }

  private async probe(server: ApiServer): Promise<void> {
    const checkUrl = `${server.url}/api/v1/health/check`;
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    try {
      const res = await fetch(checkUrl, { signal: controller.signal });
      const ms = Date.now() - start;
      server.latencyMs = ms;
      server.lastCheck = new Date();
      if (!res.ok) {
        server.status = NodeStatus.OFFLINE;
        return;
      }
      server.status =
        ms > DEGRADED_LATENCY_MS ? NodeStatus.DEGRADED : NodeStatus.HEALTHY;
    } catch {
      server.status = NodeStatus.OFFLINE;
      server.latencyMs = null;
      server.lastCheck = new Date();
      this.logger.warn("LB", `API server #${server.id} (${server.url}) unreachable`);
    } finally {
      clearTimeout(timer);
    }
  }

  public async runHealthCheck(): Promise<void> {
    await Promise.all(this.servers.map((s) => this.probe(s)));
    this.logger.info(
      "LB",
      this.servers.map((s) => `#${s.id}=${s.status}`).join(" | "),
    );
  }

  public async init(): Promise<void> {
    await this.runHealthCheck();
    this.healthTimer = setInterval(
      () => void this.runHealthCheck(),
      HEALTH_CHECK_INTERVAL_MS,
    );
  }

  public stop(): void {
    if (this.healthTimer) clearInterval(this.healthTimer);
  }
}
