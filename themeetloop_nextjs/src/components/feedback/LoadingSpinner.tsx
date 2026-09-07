import { LoaderCircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  /** Announced to assistive technology; omit only when a parent already labels the region. */
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SPINNER_SIZE_CLASSNAMES = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
} as const;

/**
 * Use for indeterminate waits with no predictable shape — a submit in flight, a short
 * refresh. When the eventual content has a known layout, prefer a skeleton so the page does
 * not shift once data arrives.
 */
export function LoadingSpinner({ label, size = "md", className }: LoadingSpinnerProps) {
  return (
    <LoaderCircleIcon
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      className={cn("animate-spin text-neutral-400", SPINNER_SIZE_CLASSNAMES[size], className)}
    />
  );
}
