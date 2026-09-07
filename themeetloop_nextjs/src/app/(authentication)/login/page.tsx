import type { Metadata } from "next";

import { LoginView } from "@/modules/authentication/views/LoginView";
import { resolveSafeAuthenticationRedirectPath } from "@/modules/authentication/validations/authenticationRedirectValidation";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to MeetLoop and pick up exactly where your last meeting left off.",
};

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;
  return <LoginView redirectPath={resolveSafeAuthenticationRedirectPath(redirect)} />;
}
