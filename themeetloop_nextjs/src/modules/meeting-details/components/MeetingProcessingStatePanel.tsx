import { CircleAlertIcon, LoaderCircleIcon, RefreshCwIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const IN_PROGRESS_COPY: Record<string, { title: string; description: string }> = {
  capturing: {
    title: "This meeting is still capturing",
    description:
      "Outcomes are generated once you end the meeting, so nothing is processed while people are still talking.",
  },
  finalizing: {
    title: "Saving the last captions",
    description:
      "MeetLoop is making sure every buffered caption reached the server before processing begins.",
  },
  processing: {
    title: "Turning conversation into outcomes",
    description:
      "MeetLoop is organizing the summary, decisions, actions, commitments, blockers, and open questions.",
  },
};

interface MeetingProcessingStatePanelProps {
  failed: boolean;
  status?: string;
  attemptCount?: number;
  onRetry: () => void;
  isRetrying: boolean;
}

export function MeetingProcessingStatePanel({
  failed,
  status = "processing",
  attemptCount = 0,
  onRetry,
  isRetrying,
}: MeetingProcessingStatePanelProps) {
  const inProgressCopy = IN_PROGRESS_COPY[status] ?? IN_PROGRESS_COPY.processing;

  return (
    <div
      role="status"
      aria-live="polite"
      className="grid min-h-[420px] place-items-center rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-sm"
    >
      <div className="max-w-md">
        <div
          className={cn(
            "mx-auto grid size-16 place-items-center rounded-2xl shadow-lg",
            failed
              ? "bg-red-600 text-white shadow-red-200"
              : "bg-neutral-950 text-white shadow-neutral-300",
          )}
        >
          {failed ? (
            <CircleAlertIcon aria-hidden="true" className="size-7" />
          ) : (
            <SparklesIcon aria-hidden="true" className="size-7" />
          )}
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight">
          {failed ? "Notes need another attempt" : inProgressCopy?.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          {failed
            ? "Your transcript is safe and complete. Retry note generation without repeating the meeting."
            : inProgressCopy?.description}
        </p>

        {!failed && (
          <div className="mx-auto mt-7 flex w-fit items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-600">
            <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin" />
            {status === "capturing" ? "Waiting for you to end the meeting" : "Working on it"}
          </div>
        )}

        {failed && (
          <>
            <Button onClick={onRetry} disabled={isRetrying} className="mt-7 h-10 rounded-xl px-5">
              <RefreshCwIcon aria-hidden="true" className={cn(isRetrying && "animate-spin")} />
              {isRetrying ? "Retrying…" : "Retry processing"}
            </Button>
            {attemptCount > 0 && (
              <p className="mt-4 text-xs text-neutral-500">
                {attemptCount} previous attempt{attemptCount === 1 ? "" : "s"}. If this keeps
                failing, the transcript is still readable below.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
