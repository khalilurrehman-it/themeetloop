import { z } from "zod";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_BACKEND_API_BASE_URL: z.string().url(),
});

const parsedPublicEnvironment = publicEnvironmentSchema.safeParse({
  NEXT_PUBLIC_BACKEND_API_BASE_URL: process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL,
});

if (!parsedPublicEnvironment.success) {
  throw new Error("NEXT_PUBLIC_BACKEND_API_BASE_URL is missing or invalid");
}

export const publicEnvironment = parsedPublicEnvironment.data;
