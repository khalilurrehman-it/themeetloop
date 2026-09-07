"use client";

import Link from "next/link";
import { useCallback } from "react";
import {
  ArrowRightIcon,
  CaptionsIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  HistoryIcon,
  RadioIcon,
  WifiOffIcon,
} from "lucide-react";

import { DataLoadErrorPanel } from "@/components/feedback/DataLoadErrorPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardMetricCard } from "@/modules/dashboard/components/DashboardMetricCard";
import { DashboardRecentMeetingsList } from "@/modules/dashboard/components/DashboardRecentMeetingsList";
import { useAsyncResource } from "@/modules/meetings/hooks/useAsyncResource";
import { listMeetings } from "@/modules/meetings/services/meetingApiClient";
import type { MeetingSummary } from "@/modules/meetings/types/meeting.types";

const CAPTURE_CHECKLIST_STEPS = [
  "Open Google Meet and turn captions on.",
  "Confirm the MeetLoop extension reports connected.",
  "End the meeting inside MeetLoop so buffered captions are saved.",
  "Review each outcome against its transcript evidence.",
] as const;

export function DashboardView() {
  const loadMeetingSummaries = useCallback(() => listMeetings(), []);
  const {
    value: meetings,
    isInitiallyLoading,
    loadError,
    refreshError,
    reload,
    isRefreshing,
  } = useAsyncResource<MeetingSummary[]>(loadMeetingSummaries);

  const loadedMeetings = meetings ?? [];
  const reviewRequiredCount = loadedMeetings.filter(
    (meeting) => meeting.status === "review_required",
  ).length;
  const completedCount = loadedMeetings.filter((meeting) => meeting.status === "completed").length;
  const capturingMeeting = loadedMeetings.find((meeting) => meeting.status === "capturing");

  return (
    <section className="pb-16">
      <div className="relative overflow-hidden rounded-3xl bg-neutral-950 p-7 text-white sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/5 blur-3xl"
        />
        <div className="relative">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            Workspace overview
          </p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                Make the conversation useful after everyone leaves.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-300">
                Capture live captions, turn them into reviewable outcomes, and preserve the source
                behind every decision.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/live-meeting"
                  className={cn(buttonVariants({ variant: "secondary" }), "h-11 rounded-xl px-5")}
                >
                  <CaptionsIcon aria-hidden="true" />
                  {capturingMeeting ? "Return to live meeting" : "Start live meeting"}
                </Link>
                <Link
                  href="/meetings"
                  className={cn(
                    buttonVariants(),
                    "group h-11 rounded-xl border border-neutral-700 bg-neutral-800 px-5 font-medium text-white shadow-sm transition-colors hover:bg-neutral-700",
                  )}
                >
                  Browse meetings
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              {capturingMeeting ? (
                <>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-300">
                    <RadioIcon aria-hidden="true" className="size-4 animate-pulse" />
                    Capturing now
                  </span>
                  <p className="mt-6 truncate text-lg font-semibold">{capturingMeeting.title}</p>
                  <Link
                    href="/live-meeting"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-200 underline underline-offset-4 hover:text-white"
                  >
                    Open live transcript
                    <ArrowRightIcon aria-hidden="true" className="size-3.5" />
                  </Link>
                </>
              ) : (
                <>
                  <ClipboardCheckIcon aria-hidden="true" className="size-5 text-amber-300" />
                  {isInitiallyLoading ? (
                    <Skeleton className="mt-8 h-9 w-12 bg-white/20" />
                  ) : (
                    <p className="mt-8 text-3xl font-semibold tabular-nums">
                      {reviewRequiredCount}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-neutral-300">
                    meeting{reviewRequiredCount === 1 ? "" : "s"} waiting for review
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {refreshError && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <WifiOffIcon aria-hidden="true" className="size-4 shrink-0" />
          Showing the last loaded workspace. MeetLoop could not refresh just now.
        </p>
      )}

      {loadError ? (
        <DataLoadErrorPanel
          className="mt-6"
          title="We could not load your workspace"
          description="Your meetings and transcripts are safe. This is a connection problem between this page and the MeetLoop API."
          onRetry={() => void reload()}
          isRetrying={isRefreshing || isInitiallyLoading}
          supportingCode={loadError instanceof Error ? loadError.name : null}
        />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <DashboardMetricCard
              icon={HistoryIcon}
              label="Meetings remembered"
              hint="Every capture kept with its transcript."
              value={loadedMeetings.length}
              isLoading={isInitiallyLoading}
            />
            <DashboardMetricCard
              icon={ClipboardCheckIcon}
              label="Reviews waiting"
              hint="Outcomes generated but not confirmed."
              value={reviewRequiredCount}
              isLoading={isInitiallyLoading}
              accentClassName="bg-blue-50 text-blue-700"
            />
            <DashboardMetricCard
              icon={CheckCircle2Icon}
              label="Reviews completed"
              hint="Confirmed and carried forward."
              value={completedCount}
              isLoading={isInitiallyLoading}
              accentClassName="bg-emerald-50 text-emerald-700"
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
            <section className="rounded-3xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    Recent memory
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">
                    Continue where you left off
                  </h2>
                </div>
                <Link
                  href="/meetings"
                  className={cn(
                    buttonVariants(),
                    "group h-9 shrink-0 rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white shadow-sm hover:bg-neutral-800",
                  )}
                >
                  View all
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
              <DashboardRecentMeetingsList
                meetings={loadedMeetings.slice(0, 5)}
                isLoading={isInitiallyLoading}
              />
            </section>

            <aside className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                Reliable capture
              </p>
              <h2 className="mt-3 text-lg font-semibold tracking-tight">Before your next call</h2>
              <ol className="mt-5 space-y-4">
                {CAPTURE_CHECKLIST_STEPS.map((checklistStep, checklistStepIndex) => (
                  <li key={checklistStep} className="flex gap-3 text-sm leading-6 text-neutral-600">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-neutral-950 text-[11px] font-semibold text-white">
                      {checklistStepIndex + 1}
                    </span>
                    {checklistStep}
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
