import "dotenv/config";
import express from "express";
import cors from "cors";

import { ConsoleLoggerService } from "./Services/logger/ConsoleLoggerService";
import { DbManager } from "./Database/connection/DbConnectionPool";

import { UserRepository }   from "./Database/repositories/users/UserRepository";
import { EntityRepository } from "./Database/repositories/entity/EntityRepository";
import { GameRepository }   from "./Database/repositories/game/GameRepository";

import { AuthService }   from "./Services/auth/AuthService";
import { UserService }   from "./Services/users/UserService";
import { EntityService } from "./Services/entity/EntityService";
import { GameService }   from "./Services/games/GameService";

import { AuthController }   from "./WebAPI/controllers/AuthController";
import { UserController }   from "./WebAPI/controllers/UserController";
import { EntityController } from "./WebAPI/controllers/EntityController";
import { GameController }   from "./WebAPI/controllers/GameController";
import { HealthController } from "./WebAPI/controllers/HealthController";

export const logger = new ConsoleLoggerService();
export const db     = new DbManager(logger);

// Repositories
const userRepo   = new UserRepository(db, logger);
const entityRepo = new EntityRepository(db, logger);
const gameRepo   = new GameRepository(db, logger);

// Services
const authService   = new AuthService(userRepo);
const userService   = new UserService(userRepo);
const entityService = new EntityService(entityRepo);
const gameService   = new GameService(gameRepo);

// Express
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ?? "*" }));
app.use(express.json());

app.use("/api/v1", new HealthController(db).getRouter());
app.use("/api/v1", new AuthController(authService).getRouter());
app.use("/api/v1", new UserController(userService).getRouter());
app.use("/api/v1", new EntityController(entityService).getRouter());
app.use("/api/v1", new GameController(gameService).getRouter());

export default app;
