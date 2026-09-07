import Link from "next/link";
import { AuthenticatedUserRedirect } from "@/modules/authentication/components/AuthenticatedUserRedirect";
import { AuthenticationPageShell } from "@/modules/authentication/components/AuthenticationPageShell";
import { LoginForm } from "@/modules/authentication/components/LoginForm";
import { createAuthenticationPageHref } from "@/modules/authentication/validations/authenticationRedirectValidation";

interface LoginViewProps {
  redirectPath: string;
}

export function LoginView({ redirectPath }: LoginViewProps) {
  return (
    <AuthenticatedUserRedirect destinationPath={redirectPath}>
      <AuthenticationPageShell
        eyebrow="Welcome back"
        title="Log in to MeetLoop"
        description="Pick up exactly where your last meeting left off."
        alternateActionPrompt={
          <>
            New to MeetLoop?{" "}
            <Link
              href={createAuthenticationPageHref("/register", redirectPath)}
              className="rounded-sm font-semibold text-neutral-950 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              Create an account
            </Link>
          </>
        }
      >
        <LoginForm redirectPath={redirectPath} />
      </AuthenticationPageShell>
    </AuthenticatedUserRedirect>
  );
}
