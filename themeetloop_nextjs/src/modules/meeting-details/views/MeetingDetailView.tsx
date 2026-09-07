"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CaptionsIcon,
  ClockIcon,
  UsersIcon,
  WifiOffIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import { DataLoadErrorPanel } from "@/components/feedback/DataLoadErrorPanel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ActionableNoteItemUpdate } from "@/modules/meeting-details/components/ActionableNoteItemCard";
import { ActionableNotesReviewPanel } from "@/modules/meeting-details/components/ActionableNotesReviewPanel";
import { MeetingProcessingStatePanel } from "@/modules/meeting-details/components/MeetingProcessingStatePanel";
import { MeetingLifecycleStatusBadge } from "@/modules/meetings/components/MeetingLifecycleStatusBadge";
import {
  loadActionableNotes,
  loadMeetingDetail,
  loadMeetingTranscript,
  markActionableNotesReviewed,
  MeetingApiError,
  retryMeetingProcessing,
  updateActionableNoteItem,
} from "@/modules/meetings/services/meetingApiClient";
import {
  formatAbsoluteMeetingTimestamp,
  formatMeetingClockTime,
  formatMeetingDuration,
} from "@/modules/meetings/transformers/meetingTimestampFormatting";
import type {
  ActionableNotes,
  MeetingDetail,
  TranscriptChunk,
} from "@/modules/meetings/types/meeting.types";

const IN_PROGRESS_STATUSES = new Set(["capturing", "finalizing", "processing"]);
const PROCESSING_POLL_INTERVAL_MILLISECONDS = 2500;

interface MeetingDetailViewProps {
  meetingId: string;
}

export function MeetingDetailView({ meetingId }: MeetingDetailViewProps) {
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [notes, setNotes] = useState<ActionableNotes | null>(null);
  const [transcript, setTranscript] = useState<TranscriptChunk[]>([]);
  const [isInitiallyLoading, setIsInitiallyLoading] = useState<boolean>(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string>("");
  const [hasStaleData, setHasStaleData] = useState<boolean>(false);
  const [isSavingReview, setIsSavingReview] = useState<boolean>(false);

  const hasLoadedOnceReference = useRef<boolean>(false);
  const isRequestInFlightReference = useRef<boolean>(false);

  const load = useCallback(async (): Promise<void> => {
    if (isRequestInFlightReference.current) return;
    isRequestInFlightReference.current = true;
    try {
      const detail = await loadMeetingDetail(meetingId);
      const chunks = await loadMeetingTranscript(meetingId);
      let loadedNotes: ActionableNotes | null = null;
      if (detail.status === "review_required" || detail.status === "completed") {
        // Notes can lag the status by a moment; a 404 here is expected, not an error.
        loadedNotes = await loadActionableNotes(meetingId).catch((error: unknown) => {
          if (error instanceof MeetingApiError && error.status === 404) return null;
          throw error;
        });
      }
      setMeeting(detail);
      setTranscript(chunks);
      setNotes(loadedNotes);
      setLoadErrorMessage("");
      setHasStaleData(false);
      hasLoadedOnceReference.current = true;
    } catch {
      // Keep whatever is already rendered: losing a loaded meeting because one poll
      // failed is worse than showing data that is a few seconds stale.
      if (hasLoadedOnceReference.current) setHasStaleData(true);
      else setLoadErrorMessage("MeetLoop could not load this meeting.");
    } finally {
      isRequestInFlightReference.current = false;
      setIsInitiallyLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    // Scheduled rather than awaited inline so the first render commits before any state
    // update lands, which keeps the effect free of cascading renders.
    const initialLoadTimer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initialLoadTimer);
  }, [load]);

  const meetingStatus = meeting?.status;
  useEffect(() => {
    if (!meetingStatus || !IN_PROGRESS_STATUSES.has(meetingStatus)) return;
    const pollTimer = window.setInterval(
      () => void load(),
      PROCESSING_POLL_INTERVAL_MILLISECONDS,
    );
    return () => window.clearInterval(pollTimer);
    // Depending on the status string rather than the meeting object keeps this interval
    // stable; the object identity changes on every poll.
  }, [meetingStatus, load]);

  async function runReviewAction(
    action: () => Promise<unknown>,
    successMessage: string,
    failureMessage: string,
  ): Promise<void> {
    try {
      setIsSavingReview(true);
      await action();
      await load();
      toast.success(successMessage);
    } catch (error) {
      toast.error(
        error instanceof MeetingApiError && error.status === 409
          ? "This meeting changed since you opened it. Refreshing the latest state."
          : failureMessage,
      );
      if (error instanceof MeetingApiError && error.status === 409) await load();
    } finally {
      setIsSavingReview(false);
    }
  }

  if (isInitiallyLoading) return <MeetingDetailSkeleton />;

  if (loadErrorMessage || !meeting)
    return (
      <DataLoadErrorPanel
        className="mt-6"
        title="This meeting would not open"
        description={
          loadErrorMessage ||
          "MeetLoop could not reach this meeting. It may have been removed, or the API is unreachable."
        }
        onRetry={() => void load()}
      />
    );

  const meetingDuration = formatMeetingDuration(meeting.startedAt, meeting.endedAt);
  // Only server-stored chunks carry an id, so evidence links are checked against what is
  // actually anchored on this page rather than assumed to resolve.
  const resolvableEvidenceChunkIds = new Set(
    transcript.flatMap((chunk) => (chunk.id ? [chunk.id] : [])),
  );

  return (
    <section className="pb-16">
      <Link
        href="/meetings"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "group h-10 rounded-xl border-neutral-300 bg-white px-4",
        )}
      >
        <ArrowLeftIcon
          aria-hidden="true"
          className="transition-transform group-hover:-translate-x-0.5"
        />
        All meetings
      </Link>

      {hasStaleData && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <WifiOffIcon aria-hidden="true" className="size-4 shrink-0" />
          Showing the last loaded state — MeetLoop could not refresh this meeting just now.
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void load()}
            className="ml-auto h-7 rounded-lg text-amber-900 hover:bg-amber-100"
          >
            Retry
          </Button>
        </p>
      )}

      <header className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <MeetingLifecycleStatusBadge status={meeting.status} />
            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600">
              {meeting.sourceLanguage}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {meeting.title}
          </h1>
          <p className="mt-3 text-sm text-neutral-500">
            {formatAbsoluteMeetingTimestamp(meeting.startedAt)}
            {meetingDuration && ` · ${meetingDuration}`}
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-2">
          <MeetingDetailMetric
            icon={CaptionsIcon}
            value={meeting.transcriptChunkCount}
            label="Captions"
          />
          <MeetingDetailMetric icon={UsersIcon} value={meeting.speakerCount} label="Speakers" />
          <MeetingDetailMetric
            icon={CalendarIcon}
            value={new Date(meeting.startedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
            label="Date"
          />
        </dl>
      </header>

      <div className="mt-8">
        {meeting.status === "failed" ? (
          <MeetingProcessingStatePanel
            failed
            attemptCount={meeting.processing?.attemptCount ?? 0}
            onRetry={() =>
              void runReviewAction(
                () => retryMeetingProcessing(meetingId),
                "Processing restarted.",
                "Processing could not be restarted.",
              )
            }
            isRetrying={isSavingReview}
          />
        ) : IN_PROGRESS_STATUSES.has(meeting.status) ? (
          <MeetingProcessingStatePanel
            failed={false}
            status={meeting.status}
            attemptCount={meeting.processing?.attemptCount ?? 0}
            onRetry={() => undefined}
            isRetrying={false}
          />
        ) : notes ? (
          <ActionableNotesReviewPanel
            notes={notes}
            resolvableEvidenceChunkIds={resolvableEvidenceChunkIds}
            isSaving={isSavingReview}
            onUpdate={(itemId: string, update: ActionableNoteItemUpdate) =>
              runReviewAction(
                () => updateActionableNoteItem(meetingId, itemId, update),
                "Review saved.",
                "That change could not be saved.",
              )
            }
            onFinish={() =>
              runReviewAction(
                () => markActionableNotesReviewed(meetingId),
                "Meeting review completed.",
                "Review could not be completed.",
              )
            }
          />
        ) : (
          <DataLoadErrorPanel
            title="Outcomes are not available yet"
            description="This meeting is marked as reviewed but MeetLoop could not load its actionable notes."
            onRetry={() => void load()}
          />
        )}
      </div>

      <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-neutral-100">
            <ClockIcon aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold tracking-tight">Source transcript</h2>
            <p className="text-xs text-neutral-500">
              Every outcome above can be checked against the original caption.
            </p>
          </div>
        </div>
        {transcript.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
            <CaptionsIcon aria-hidden="true" className="mx-auto size-7 text-neutral-300" />
            <p className="mt-3 text-sm font-medium">No captions were captured</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-neutral-500">
              Check that Google Meet captions and the MeetLoop extension are both enabled before
              the next call.
            </p>
          </div>
        ) : (
          <ol className="mt-7 space-y-1">
            {transcript.map((chunk) => (
              <li
                id={chunk.id ? `transcript-${chunk.id}` : undefined}
                key={chunk.id ?? chunk.sequenceNumber}
                className="scroll-mt-24 rounded-2xl p-4 transition-colors target:bg-amber-50 target:ring-1 target:ring-amber-200 sm:grid sm:grid-cols-[140px_1fr] sm:gap-5"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {chunk.speakerDisplayName}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-neutral-400">
                    {formatMeetingClockTime(chunk.capturedAt)}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-700 sm:mt-0">
                  {chunk.transcriptText}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}

function MeetingDetailMetric({
  icon: MetricIcon,
  value,
  label,
}: {
  icon: typeof CaptionsIcon;
  value: string | number;
  label: string;
}) {
  return (
    <div className="min-w-24 rounded-2xl border border-neutral-200 bg-white p-3">
      <MetricIcon aria-hidden="true" className="size-4 text-neutral-400" />
      <dd className="mt-3 text-sm font-semibold tabular-nums text-neutral-950">{value}</dd>
      <dt className="text-[11px] text-neutral-500">{label}</dt>
    </div>
  );
}

function MeetingDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading meeting" className="pb-16">
      <span className="sr-only">Opening your meeting memory…</span>
      <div aria-hidden="true">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="w-full">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="mt-4 h-10 w-2/3" />
            <Skeleton className="mt-3 h-4 w-48" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((metricIndex) => (
              <Skeleton key={metricIndex} className="h-24 w-24 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-11/12" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <div className="mt-7 space-y-3">
            {[0, 1, 2].map((outcomeIndex) => (
              <Skeleton key={outcomeIndex} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
          <Skeleton className="h-5 w-44" />
          <div className="mt-7 space-y-4">
            {[0, 1, 2, 3, 4].map((transcriptLineIndex) => (
              <div key={transcriptLineIndex} className="sm:grid sm:grid-cols-[140px_1fr] sm:gap-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-4 w-full sm:mt-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
