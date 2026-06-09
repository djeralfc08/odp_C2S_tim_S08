import "dotenv/config";
import express, { Request } from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import { ConsoleLoggerService } from "./Services/logger/ConsoleLoggerService";
import { LoadBalancer } from "./Infrastructure/loadBalancer/LoadBalancer";
import { HealthController } from "./WebAPI/controllers/HealthController";
import { DbManager } from "./Database/connection/DbConnectionPool";
import { ApiServer } from "./Infrastructure/loadBalancer/ApiServer";

const logger = new ConsoleLoggerService();
const loadBalancer = new LoadBalancer(logger);
const db = new DbManager(logger);

type ReqWithLb = Request & { lbServer?: ApiServer };

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ?? "*" }));

app.use("/api/v1", new HealthController(db, loadBalancer).getRouter());

app.use(
  "/api/v1",
  createProxyMiddleware({
    changeOrigin: true,
    pathFilter: (pathname) => !pathname.startsWith("/health"),
    pathRewrite: (path) => `/api/v1${path}`,
    router: (req) => {
      const expressReq = req as Request;
      const server = loadBalancer.pickServer(expressReq.ip);
      if (!server) return "";
      loadBalancer.incrementConnections(server);
      (req as ReqWithLb).lbServer = server;
      return server.url;
    },
    on: {
      proxyRes: (_proxyRes, req) => {
        const server = (req as ReqWithLb).lbServer;
        if (server) loadBalancer.decrementConnections(server);
      },
      error: (err, req, res) => {
        const server = (req as ReqWithLb).lbServer;
        if (server) loadBalancer.decrementConnections(server);
        logger.error("Gateway", "Proxy error", err);
        if (res && "writeHead" in res && !res.headersSent) {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ success: false, message: "No healthy API servers" }),
          );
        }
      },
    },
  }),
);

const PORT = parseInt(process.env.PORT ?? "4000", 10);

async function start(): Promise<void> {
  await Promise.all([loadBalancer.init(), db.init()]);

  app.listen(PORT, () => {
    logger.info("Gateway", `Load balancer at http://localhost:${PORT}/api/v1`);
    logger.info("Gateway", `Strategy: ${process.env.LB_STRATEGY ?? "round_robin"}`);
  });
}

start().catch((err: Error) => logger.error("Gateway", "Fatal startup error", err));

process.on("SIGINT", () => {
  loadBalancer.stop();
  db.stop();
});
