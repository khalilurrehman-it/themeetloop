import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { postgresqlConnectionPool } from "./postgresqlConnectionPool.js";

const migrationFileNames = [
  "0001_create_meeting_capture_schema.sql",
  "0002_create_actionable_notes_processing_schema.sql",
];

try {
  for (const migrationFileName of migrationFileNames) {
    const migrationFileUrl = new URL(`./migrations/${migrationFileName}`, import.meta.url);
    const migrationSql = await readFile(fileURLToPath(migrationFileUrl), "utf8");
    await postgresqlConnectionPool.query(migrationSql);
    console.info(
      JSON.stringify({
        severity: "info",
        event: "database_migration_completed",
        migration: migrationFileName,
      }),
    );
  }
} finally {
  await postgresqlConnectionPool.end();
}
