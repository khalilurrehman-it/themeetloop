import express, { type Router } from "express";

export const healthCheckRoutes: Router = express.Router();

healthCheckRoutes.get("/live", (_request, response) =>
  response.json({ success: true, data: { status: "live" } }),
);
healthCheckRoutes.get("/ready", (_request, response) =>
  response.json({ success: true, data: { status: "ready" } }),
);
