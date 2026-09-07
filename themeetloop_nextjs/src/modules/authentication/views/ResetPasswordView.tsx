import Link from "next/link";
import { Suspense } from "react";

import { AuthenticationPageShell } from "@/modules/authentication/components/AuthenticationPageShell";
import { ResetPasswordForm } from "@/modules/authentication/components/ResetPasswordForm";

export function ResetPasswordView() {
  return (
    <AuthenticationPageShell
      eyebrow="Secure your account"
      title="Choose a new password"
      description="Choosing a new password also signs you out on your other devices."
      alternateActionPrompt={
        <>
          Need another link?{" "}
          <Link
            href="/forgot-password"
            className="font-semibold text-neutral-950 underline underline-offset-4"
          >
            Request password reset
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-52 animate-pulse rounded-2xl bg-neutral-100" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthenticationPageShell>
  );
}
