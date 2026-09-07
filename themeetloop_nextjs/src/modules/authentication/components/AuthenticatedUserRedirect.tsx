"use client";
import { useRouter } from "nextjs-toploader/app";
import { useEffect, type ReactNode } from "react";
import { FullScreenLoadingOverlay } from "@/components/feedback/FullScreenLoadingOverlay";
import { authenticationClient } from "@/modules/authentication/services/authenticationClient";

export function AuthenticatedUserRedirect({
  destinationPath,
  children,
}: {
  destinationPath: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = authenticationClient.useSession();
  useEffect(() => {
    if (!isPending && session) router.replace(destinationPath);
  }, [destinationPath, isPending, router, session]);
  if (isPending || session)
    return (
      <FullScreenLoadingOverlay
        title={session ? "Opening your workspace…" : "One moment…"}
        description="This usually takes a moment."
      />
    );
  return children;
}
