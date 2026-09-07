import type { Metadata } from "next";

import { RegisterView } from "@/modules/authentication/views/RegisterView";
import { resolveSafeAuthenticationRedirectPath } from "@/modules/authentication/validations/authenticationRedirectValidation";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a MeetLoop account to capture meetings, keep commitments, and carry context forward.",
};

interface RegisterPageProps {
  searchParams: Promise<{ redirect?: string | string[] }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { redirect } = await searchParams;
  return <RegisterView redirectPath={resolveSafeAuthenticationRedirectPath(redirect)} />;
}
