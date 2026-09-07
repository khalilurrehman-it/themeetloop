import Link from "next/link";
import { ChevronRightIcon, ClockIcon, LanguagesIcon } from "lucide-react";

import { MeetingLifecycleStatusBadge } from "@/modules/meetings/components/MeetingLifecycleStatusBadge";
import { resolveMeetingLifecycleStatusPresentation } from "@/modules/meetings/constants/meetingLifecycleStatusPresentation";
import {
  formatAbsoluteMeetingTimestamp,
  formatMeetingDuration,
} from "@/modules/meetings/transformers/meetingTimestampFormatting";
import type { MeetingSummary } from "@/modules/meetings/types/meeting.types";
import { cn } from "@/lib/utils";

interface MeetingArchiveCardProps {
  meeting: MeetingSummary;
}

export function MeetingArchiveCard({ meeting }: MeetingArchiveCardProps) {
  const presentation = resolveMeetingLifecycleStatusPresentation(meeting.status);
  const StatusIcon = presentation.icon;
  const duration = formatMeetingDuration(meeting.startedAt, meeting.endedAt);

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="group flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_12px_32px_-18px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl border",
          presentation.badgeClassName,
        )}
      >
        <StatusIcon className={cn("size-5", presentation.isInProgress && "animate-pulse")} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="truncate font-semibold text-neutral-950">{meeting.title}</h2>
          <MeetingLifecycleStatusBadge status={meeting.status} />
        </div>
        <p className="mt-1.5 text-sm leading-6 text-neutral-500">{presentation.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon aria-hidden="true" className="size-3.5 text-neutral-400" />
            {formatAbsoluteMeetingTimestamp(meeting.startedAt)}
            {duration && ` · ${duration}`}
          </span>
          <span className="inline-flex items-center gap-1.5 uppercase">
            <LanguagesIcon aria-hidden="true" className="size-3.5 text-neutral-400" />
            {meeting.sourceLanguage}
          </span>
        </div>
      </div>

      <ChevronRightIcon
        aria-hidden="true"
        className="mt-3 size-5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-600"
      />
    </Link>
  );
}
