"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  CalendarDaysIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchXIcon,
  WifiOffIcon,
} from "lucide-react";

import { DataLoadErrorPanel } from "@/components/feedback/DataLoadErrorPanel";
import { EmptyStatePanel } from "@/components/feedback/EmptyStatePanel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MeetingArchiveCard } from "@/modules/meetings/components/MeetingArchiveCard";
import {
  MeetingArchiveFilterBar,
  type MeetingArchiveStatusFilter,
} from "@/modules/meetings/components/MeetingArchiveFilterBar";
import { useAsyncResource } from "@/modules/meetings/hooks/useAsyncResource";
import { listMeetings } from "@/modules/meetings/services/meetingApiClient";
import type { MeetingSummary } from "@/modules/meetings/types/meeting.types";

export function MeetingsListView() {
  const loadMeetingSummaries = useCallback(() => listMeetings(), []);
  const {
    value: meetings,
    isInitiallyLoading,
    isRefreshing,
    loadError,
    refreshError,
    reload,
    refresh,
  } = useAsyncResource<MeetingSummary[]>(loadMeetingSummaries);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<MeetingArchiveStatusFilter>("all");

  const loadedMeetings = useMemo(() => meetings ?? [], [meetings]);

  const statusCounts = useMemo(
    () =>
      loadedMeetings.reduce<Record<string, number>>((counts, meeting) => {
        counts[meeting.status] = (counts[meeting.status] ?? 0) + 1;
        return counts;
      }, {}),
    [loadedMeetings],
  );

  const visibleMeetings = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    return loadedMeetings.filter((meeting) => {
      const matchesStatus = statusFilter === "all" || meeting.status === statusFilter;
      const matchesSearch =
        normalizedSearchTerm.length === 0 ||
        meeting.title.toLowerCase().includes(normalizedSearchTerm);
      return matchesStatus && matchesSearch;
    });
  }, [loadedMeetings, searchTerm, statusFilter]);

  const hasActiveFilters = searchTerm.trim().length > 0 || statusFilter !== "all";

  return (
    <section className="pb-16">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Meeting archive
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Meetings</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Every capture, its transcript, and the outcomes drawn from it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void refresh()}
            disabled={isRefreshing || isInitiallyLoading}
            aria-label="Refresh meetings"
            className="h-10 rounded-xl"
          >
            <RefreshCwIcon aria-hidden="true" className={cn(isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Link href="/live-meeting" className={cn(buttonVariants(), "h-10 rounded-xl px-4")}>
            <PlusIcon aria-hidden="true" />
            Start meeting
          </Link>
        </div>
      </div>

      {refreshError && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <WifiOffIcon aria-hidden="true" className="size-4 shrink-0" />
          Showing your last loaded meetings. The most recent refresh did not reach MeetLoop.
        </p>
      )}

      {loadError ? (
        <DataLoadErrorPanel
          className="mt-8"
          title="We could not load your meetings"
          description="Nothing has been lost. MeetLoop could not reach the meetings API from this page."
          onRetry={() => void reload()}
          isRetrying={isInitiallyLoading || isRefreshing}
          supportingCode={loadError instanceof Error ? loadError.name : null}
        />
      ) : isInitiallyLoading ? (
        <div className="mt-8 grid gap-3" role="status" aria-label="Loading meetings">
          <span className="sr-only">Loading your meeting memory…</span>
          {[0, 1, 2, 3, 4].map((skeletonCardIndex) => (
            <div
              key={skeletonCardIndex}
              aria-hidden="true"
              className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5"
            >
              <Skeleton className="size-11 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-52 max-w-[60%]" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="mt-3 h-4 w-72 max-w-full" />
                <Skeleton className="mt-3 h-3 w-44" />
              </div>
            </div>
          ))}
        </div>
      ) : loadedMeetings.length === 0 ? (
        <EmptyStatePanel
          className="mt-8"
          icon={CalendarDaysIcon}
          title="No meetings yet"
          description="Start your first capture and it will appear here with its transcript and outcomes."
          action={
            <Link href="/live-meeting" className={cn(buttonVariants(), "h-10 rounded-xl px-5")}>
              <PlusIcon aria-hidden="true" />
              Start your first meeting
            </Link>
          }
        />
      ) : (
        <>
          <MeetingArchiveFilterBar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusCounts={statusCounts}
            totalCount={loadedMeetings.length}
          />

          {visibleMeetings.length === 0 ? (
            <EmptyStatePanel
              className="mt-6"
              icon={SearchXIcon}
              title="No meetings match these filters"
              description="Try a different search term, or clear the filters to see everything in your archive."
              action={
                <Button
                  variant="outline"
                  className="h-10 rounded-xl"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <p aria-live="polite" className="mt-6 text-xs text-neutral-500">
                Showing {visibleMeetings.length} of {loadedMeetings.length} meeting
                {loadedMeetings.length === 1 ? "" : "s"}
                {hasActiveFilters ? " (filtered)" : ""}
              </p>
              <ul className="mt-3 grid gap-3">
                {visibleMeetings.map((meeting) => (
                  <li key={meeting.id}>
                    <MeetingArchiveCard meeting={meeting} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
