import type { ReactNode } from "react";

import { MeetLoopBrandMark } from "@/components/application-layout/MeetLoopBrandMark";

interface ApplicationStatusPanelProps {
  statusCode: string;
  title: string;
  description: string;
  /** Action controls, rendered in a row on wider screens. */
  actions: ReactNode;
  /** Optional supporting detail such as an error digest. */
  supportingDetail?: string;
}

export function ApplicationStatusPanel({
  statusCode,
  title,
  description,
  actions,
  supportingDetail,
}: ApplicationStatusPanelProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      {/* Same container as the landing navigation bar so the brand mark lines up across pages. */}
      <header className="w-full border-b border-neutral-200">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-5 sm:px-8">
          <MeetLoopBrandMark />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-20 sm:px-10">
        <div className="w-full max-w-lg text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-neutral-500">
            {statusCode}
          </p>
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-tighter text-neutral-950 sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-md text-balance text-base leading-7 text-neutral-600">
            {description}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            {actions}
          </div>

          {supportingDetail && (
            <p className="mt-8 break-words font-mono text-xs text-neutral-400">
              {supportingDetail}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
