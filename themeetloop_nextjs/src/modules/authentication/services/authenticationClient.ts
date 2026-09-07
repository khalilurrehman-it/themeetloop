import { createAuthClient } from "better-auth/react";

import { publicEnvironment } from "@/configuration/publicEnvironmentConfiguration";

export const authenticationClient = createAuthClient({
  baseURL: publicEnvironment.NEXT_PUBLIC_BACKEND_API_BASE_URL,
  fetchOptions: { credentials: "include" },
});
