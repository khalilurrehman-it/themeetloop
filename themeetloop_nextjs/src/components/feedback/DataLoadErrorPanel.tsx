import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataLoadErrorPanelProps {
  title: string;
  description: string;
  onRetry: () => void;
  isRetrying?: boolean;
  /** Stable, non-sensitive code shown so support can correlate a report. */
  supportingCode?: string | null;
  className?: string;
}

export function DataLoadErrorPanel({
  title,
  description,
  onRetry,
  isRetrying = false,
  supportingCode,
  className,
}: DataLoadErrorPanelProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-3xl border border-red-200 bg-red-50/60 p-8 text-center sm:p-10",
        className,
      )}
    >
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-100 text-red-700">
        <TriangleAlertIcon aria-hidden="true" className="size-6" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-neutral-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-600">{description}</p>
      <Button
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-6 h-10 rounded-xl px-5"
        aria-live="polite"
      >
        <RefreshCwIcon aria-hidden="true" className={cn(isRetrying && "animate-spin")} />
        {isRetrying ? "Retrying…" : "Try again"}
      </Button>
      {supportingCode && (
        <p className="mt-5 font-mono text-xs text-neutral-500">Reference: {supportingCode}</p>
      )}
    </div>
  );
}
