import { cn } from "@/lib/utils";
import { resolveMeetingLifecycleStatusPresentation } from "@/modules/meetings/constants/meetingLifecycleStatusPresentation";

interface MeetingLifecycleStatusBadgeProps {
  status: string;
  className?: string;
}

export function MeetingLifecycleStatusBadge({
  status,
  className,
}: MeetingLifecycleStatusBadgeProps) {
  const presentation = resolveMeetingLifecycleStatusPresentation(status);
  const StatusIcon = presentation.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        presentation.badgeClassName,
        className,
      )}
    >
      <StatusIcon
        aria-hidden="true"
        className={cn("size-3.5", presentation.isInProgress && "animate-pulse")}
      />
      {presentation.label}
    </span>
  );
}
