import {
  CheckCircle2Icon,
  CircleAlertIcon,
  ClipboardCheckIcon,
  LoaderCircleIcon,
  RadioIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";

import type { MeetingLifecycleStatus } from "@/modules/meetings/types/meeting.types";

export interface MeetingLifecycleStatusPresentation {
  label: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind classes for the badge surface. */
  badgeClassName: string;
  /** Solid colour used for dots and accents. */
  accentClassName: string;
  isInProgress: boolean;
}

export const MEETING_LIFECYCLE_STATUS_PRESENTATION: Record<
  MeetingLifecycleStatus,
  MeetingLifecycleStatusPresentation
> = {
  capturing: {
    label: "Capturing",
    description: "Captions are streaming in right now.",
    icon: RadioIcon,
    badgeClassName: "border-red-200 bg-red-50 text-red-700",
    accentClassName: "bg-red-500",
    isInProgress: true,
  },
  finalizing: {
    label: "Finalizing",
    description: "Saving the last captions before processing.",
    icon: LoaderCircleIcon,
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
    accentClassName: "bg-amber-500",
    isInProgress: true,
  },
  processing: {
    label: "Processing",
    description: "Turning the transcript into reviewable outcomes.",
    icon: SparklesIcon,
    badgeClassName: "border-violet-200 bg-violet-50 text-violet-800",
    accentClassName: "bg-violet-500",
    isInProgress: true,
  },
  review_required: {
    label: "Review needed",
    description: "Outcomes are ready and waiting for your review.",
    icon: ClipboardCheckIcon,
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-800",
    accentClassName: "bg-blue-500",
    isInProgress: false,
  },
  completed: {
    label: "Completed",
    description: "Reviewed and carried into your meeting memory.",
    icon: CheckCircle2Icon,
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
    accentClassName: "bg-emerald-500",
    isInProgress: false,
  },
  failed: {
    label: "Needs retry",
    description: "Processing did not finish. The transcript is still safe.",
    icon: CircleAlertIcon,
    badgeClassName: "border-red-200 bg-red-50 text-red-700",
    accentClassName: "bg-red-500",
    isInProgress: false,
  },
};

/**
 * Falls back to a neutral presentation so an unknown status coming from a newer backend
 * renders as readable text instead of crashing the page.
 */
export function resolveMeetingLifecycleStatusPresentation(
  status: string,
): MeetingLifecycleStatusPresentation {
  return (
    MEETING_LIFECYCLE_STATUS_PRESENTATION[status as MeetingLifecycleStatus] ?? {
      label: status.replaceAll("_", " "),
      description: "",
      icon: CircleAlertIcon,
      badgeClassName: "border-neutral-200 bg-neutral-100 text-neutral-700",
      accentClassName: "bg-neutral-400",
      isInProgress: false,
    }
  );
}
