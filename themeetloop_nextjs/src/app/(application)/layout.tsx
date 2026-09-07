import type { ReactNode } from "react";
import { AuthenticatedApplicationShell } from "@/components/application-layout/AuthenticatedApplicationShell";
export default function ApplicationLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedApplicationShell>{children}</AuthenticatedApplicationShell>;
}
