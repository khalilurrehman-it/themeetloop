import { Pool } from "pg";

import { environmentVariables } from "../../configuration/environmentVariablesConfiguration.js";
import { logApplicationEvent } from "../logging/structuredApplicationLogger.js";

export const postgresqlConnectionPool = new Pool({
  connectionString: environmentVariables.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: environmentVariables.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

postgresqlConnectionPool.on("error", (error) => {
  logApplicationEvent(
    "warn",
    "postgresql_idle_connection_error",
    { recovery: "The pool will replace the disconnected client automatically." },
    error,
  );
});
