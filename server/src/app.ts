import "dotenv/config";
import express from "express";
import cors from "cors";

import { ConsoleLoggerService } from "./Services/logger/ConsoleLoggerService";
import { DbManager } from "./Database/connection/DbConnectionPool";

import { UserRepository } from "./Database/repositories/users/UserRepository";
import { GameRepository } from "./Database/repositories/game/GameRepository";
import { TournamentRepository } from "./Database/repositories/tournament/TournamentRepository";
import { TournamentRegistrationRepository } from "./Database/repositories/tournament/TournamentRegistrationRepository";
import { TeamRepository } from "./Database/repositories/team/TeamRepository";
import { WatchlistRepository } from "./Database/repositories/watchlist/WatchlistRepository";
import { MatchRepository } from "./Database/repositories/match/MatchRepository";
import { AuditRepository } from "./Database/repositories/audit/AuditRepository";

import { AuthService } from "./Services/auth/AuthService";
import { AuditService } from "./Services/audit/AuditService";
import { UserService } from "./Services/users/UserService";
import { GameService } from "./Services/games/GameService";
import { TournamentService } from "./Services/tournament/TournamentService";
import { TournamentRegistrationService } from "./Services/tournament/TournamentRegistrationService";
import { WatchlistService } from "./Services/watchlist/WatchlistService";
import { TeamService } from "./Services/team/TeamService";
import { MatchService } from "./Services/match/MatchService";

import { AuthController } from "./WebAPI/controllers/AuthController";
import { AuditController } from "./WebAPI/controllers/AuditController";
import { UserController } from "./WebAPI/controllers/UserController";
import { GameController } from "./WebAPI/controllers/GameController";
import { HealthController } from "./WebAPI/controllers/HealthController";
import { TournamentController } from "./WebAPI/controllers/TournamentController";
import { TeamController } from "./WebAPI/controllers/TeamController";
import { MatchController } from "./WebAPI/controllers/MatchController";

export const logger = new ConsoleLoggerService();
export const db = new DbManager(logger);

// Repositories
const userRepo = new UserRepository(db, logger);
const auditRepo = new AuditRepository(db, logger);
const gameRepo = new GameRepository(db, logger);
const tournamentRepo = new TournamentRepository(db, logger);
const registrationRepo = new TournamentRegistrationRepository(db, logger);
const teamRepo = new TeamRepository(db, logger);
const watchlistRepo = new WatchlistRepository(db, logger);
const matchRepo = new MatchRepository(db, logger);

// Services
const auditService = new AuditService(auditRepo);
const authService = new AuthService(userRepo, auditService);
const userService = new UserService(userRepo);
const gameService = new GameService(gameRepo);
const tournamentService = new TournamentService(tournamentRepo, auditService);
const registrationService = new TournamentRegistrationService(
  tournamentRepo,
  registrationRepo,
  teamRepo,
  matchRepo,
  gameRepo,
);
const watchlistService = new WatchlistService(watchlistRepo, tournamentRepo, auditService);
const teamService = new TeamService(teamRepo, auditService);
const matchService = new MatchService(matchRepo, auditService);

// Express
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ?? "*" }));
app.use(express.json({ limit: "2mb" }));

app.use("/api/v1", new HealthController(db).getRouter());
app.use("/api/v1", new AuthController(authService).getRouter());
app.use("/api/v1", new AuditController(auditService).getRouter());
app.use("/api/v1", new UserController(userService).getRouter());
app.use("/api/v1", new GameController(gameService).getRouter());
app.use("/api/v1", new TeamController(teamService).getRouter());
app.use("/api/v1", new MatchController(matchService).getRouter());
app.use(
  "/api/v1",
  new TournamentController(tournamentService, registrationService, watchlistService).getRouter(),
);

export default app;
