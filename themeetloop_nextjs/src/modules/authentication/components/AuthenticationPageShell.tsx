import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, CircleCheckIcon } from "lucide-react";

import { MeetLoopBrandMark } from "@/components/application-layout/MeetLoopBrandMark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUPPORTING_POINTS = [
  "Speaker-aware live transcript that survives a reconnect",
  "Decisions, owners, and due dates linked to the exact moment",
  "Commitments carried forward with an auditable history",
] as const;

interface AuthenticationPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  alternateActionPrompt: ReactNode;
}

export function AuthenticationPageShell({
  eyebrow,
  title,
  description,
  children,
  alternateActionPrompt,
}: AuthenticationPageShellProps) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Narrative panel. Hidden on small screens so the form owns the first viewport. */}
      <section className="hidden flex-col justify-between bg-neutral-950 p-12 text-white lg:flex">
        <MeetLoopBrandMark appearance="inverted" />
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-neutral-500">
            The meeting memory layer
          </p>
          <h2 className="mt-4 max-w-md text-balance text-4xl font-semibold leading-tight tracking-tighter">
            Your meetings should remember what your team forgets.
          </h2>
          <ul className="mt-10 flex flex-col gap-4">
            {SUPPORTING_POINTS.map((supportingPoint) => (
              <li key={supportingPoint} className="flex items-start gap-3 text-sm text-neutral-400">
                <CircleCheckIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-white" />
                {supportingPoint}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-neutral-600">
          © {new Date().getFullYear()} MeetLoop. Built in Pakistan.
        </p>
      </section>

      <section className="flex w-full flex-col bg-white">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-6 sm:px-10">
          <MeetLoopBrandMark />
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "group h-9 gap-2 rounded-xl border-neutral-300 bg-white px-3.5",
            )}
          >
            <ArrowLeftIcon
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Back to home
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-16 pt-4 sm:px-10">
          <div className="w-full max-w-sm">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-neutral-500">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tighter text-neutral-950">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">{description}</p>

            <div className="mt-8">{children}</div>

            <p className="mt-8 text-center text-sm text-neutral-600">{alternateActionPrompt}</p>
          </div>
        </main>
      </section>
    </div>
  );
}
