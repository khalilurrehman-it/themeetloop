import Link from "next/link";
import { CalendarPlusIcon, ChevronRightIcon } from "lucide-react";

import { EmptyStatePanel } from "@/components/feedback/EmptyStatePanel";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MeetingLifecycleStatusBadge } from "@/modules/meetings/components/MeetingLifecycleStatusBadge";
import { formatRelativeMeetingTimestamp } from "@/modules/meetings/transformers/meetingTimestampFormatting";
import type { MeetingSummary } from "@/modules/meetings/types/meeting.types";

interface DashboardRecentMeetingsListProps {
  meetings: MeetingSummary[];
  isLoading: boolean;
}

export function DashboardRecentMeetingsList({
  meetings,
  isLoading,
}: DashboardRecentMeetingsListProps) {
  if (isLoading) {
    return (
      <ul className="mt-4 divide-y divide-neutral-100" aria-hidden="true">
        {[0, 1, 2, 3].map((skeletonRowIndex) => (
          <li key={skeletonRowIndex} className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </li>
        ))}
      </ul>
    );
  }

  if (meetings.length === 0) {
    return (
      <EmptyStatePanel
        className="mt-5"
        icon={CalendarPlusIcon}
        title="Your first meeting starts the memory"
        description="Capture a Google Meet call, or use the demo caption input to see the full loop end to end."
        action={
          <Link href="/live-meeting" className={cn(buttonVariants(), "h-10 rounded-xl px-5")}>
            Start a meeting
          </Link>
        }
      />
    );
  }

  return (
    <ul className="mt-4 divide-y divide-neutral-100">
      {meetings.map((meeting) => (
        <li key={meeting.id}>
          <Link
            href={`/meetings/${meeting.id}`}
            className="group flex items-center justify-between gap-4 rounded-xl px-2 py-4 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-neutral-950">{meeting.title}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {formatRelativeMeetingTimestamp(meeting.startedAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <MeetingLifecycleStatusBadge status={meeting.status} />
              <ChevronRightIcon
                aria-hidden="true"
                className="size-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-500"
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
