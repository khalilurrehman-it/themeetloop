import "dotenv/config";
import { z } from "zod";

const environmentVariablesSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1024).max(65535).default(8080),
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  RESEND_API_KEY: z.string().min(10),
  RESEND_FROM_EMAIL: z.string().email(),
  RESEND_FROM_NAME: z.string().trim().min(1).max(100).default("MeetLoop"),
  ANTHROPIC_API_KEY: z.string().min(20).optional(),
  ANTHROPIC_MODEL: z.string().trim().min(1).max(100).default("claude-haiku-4-5"),
});

const parsedEnvironmentVariables = environmentVariablesSchema.safeParse(process.env);

if (!parsedEnvironmentVariables.success) {
  const invalidVariableNames = parsedEnvironmentVariables.error.issues
    .map((issue) => issue.path.join("."))
    .join(", ");
  throw new Error(`Invalid or missing environment variables: ${invalidVariableNames}`);
}

export const environmentVariables = parsedEnvironmentVariables.data;
