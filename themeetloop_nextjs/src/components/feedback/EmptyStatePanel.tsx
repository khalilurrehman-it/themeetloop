import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStatePanelProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyStatePanel({
  icon: EmptyStateIcon,
  title,
  description,
  action,
  className,
}: EmptyStatePanelProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-dashed border-neutral-300 bg-white p-10 text-center sm:p-14",
        className,
      )}
    >
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-neutral-100 text-neutral-500">
        <EmptyStateIcon aria-hidden="true" className="size-6" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-neutral-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
