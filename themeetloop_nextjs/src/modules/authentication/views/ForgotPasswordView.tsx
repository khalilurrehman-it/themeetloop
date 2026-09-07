import Link from "next/link";

import { AuthenticationPageShell } from "@/modules/authentication/components/AuthenticationPageShell";
import { ForgotPasswordForm } from "@/modules/authentication/components/ForgotPasswordForm";

export function ForgotPasswordView() {
  return (
    <AuthenticationPageShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your email address and we will send a time-limited reset link."
      alternateActionPrompt={
        <>
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-semibold text-neutral-950 underline underline-offset-4"
          >
            Return to login
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthenticationPageShell>
  );
}
