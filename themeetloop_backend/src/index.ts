import { createServer } from "node:http";

import { createHttpApplication } from "./bootstrap/createHttpApplication.js";
import { environmentVariables } from "./configuration/environmentVariablesConfiguration.js";
import { postgresqlConnectionPool } from "./infrastructure/database/postgresqlConnectionPool.js";
import {
  startMeetingProcessingWorker,
  stopMeetingProcessingWorker,
} from "./modules/meeting-processing/meetingProcessingWorker.js";

const httpApplication = createHttpApplication();
const httpServer = createServer(httpApplication);
startMeetingProcessingWorker();

httpServer.listen(environmentVariables.PORT, () => {
  console.info(
    JSON.stringify({
      severity: "info",
      event: "http_server_started",
      port: environmentVariables.PORT,
    }),
  );
});

async function shutdownGracefully(signal: string): Promise<void> {
  console.info(JSON.stringify({ severity: "info", event: "shutdown_started", signal }));
  httpServer.close(async () => {
    stopMeetingProcessingWorker();
    await postgresqlConnectionPool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdownGracefully("SIGTERM"));
process.on("SIGINT", () => void shutdownGracefully("SIGINT"));
