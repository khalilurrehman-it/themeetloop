import Link from "next/link";

import { AuthenticatedUserRedirect } from "@/modules/authentication/components/AuthenticatedUserRedirect";
import { AuthenticationPageShell } from "@/modules/authentication/components/AuthenticationPageShell";
import { RegisterForm } from "@/modules/authentication/components/RegisterForm";
import { createAuthenticationPageHref } from "@/modules/authentication/validations/authenticationRedirectValidation";

interface RegisterViewProps {
  redirectPath: string;
}

export function RegisterView({ redirectPath }: RegisterViewProps) {
  return (
    <AuthenticatedUserRedirect destinationPath={redirectPath}>
      <AuthenticationPageShell
        eyebrow="Get started"
        title="Create your MeetLoop account"
        description="Capture the conversation, keep the commitments, and carry the context forward."
        alternateActionPrompt={
          <>
            Already have an account?{" "}
            <Link
              href={createAuthenticationPageHref("/login", redirectPath)}
              className="rounded-sm font-semibold text-neutral-950 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              Log in
            </Link>
          </>
        }
      >
        <RegisterForm redirectPath={redirectPath} />
      </AuthenticationPageShell>
    </AuthenticatedUserRedirect>
  );
}
