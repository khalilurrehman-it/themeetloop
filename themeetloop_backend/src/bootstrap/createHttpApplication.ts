import { randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";

import { environmentVariables } from "../configuration/environmentVariablesConfiguration.js";
import { auth } from "../modules/authentication/authenticationConfiguration.js";
import { globalErrorHandlerMiddleware } from "../transport/http/middleware/globalErrorHandlerMiddleware.js";
import { healthCheckRoutes } from "../transport/http/routes/healthCheckRoutes.js";
import { meetingRoutes } from "../transport/http/routes/meetingRoutes.js";

export function createHttpApplication(): express.Express {
  const application = express();
  application.disable("x-powered-by");
  application.use(helmet());
  application.use(
    cors({
      origin: environmentVariables.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    }),
  );
  application.use((request, response, next) => {
    const requestId = request.header("X-Request-ID") ?? randomUUID();
    response.setHeader("X-Request-ID", requestId);
    next();
  });
  application.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 30,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  application.all("/api/auth/*splat", toNodeHandler(auth));
  application.use(express.json({ limit: "100kb" }));
  application.use("/api/v1/health", healthCheckRoutes);
  application.use(
    "/api/v1/meetings",
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
    meetingRoutes,
  );
  application.use(globalErrorHandlerMiddleware);
  return application;
}
