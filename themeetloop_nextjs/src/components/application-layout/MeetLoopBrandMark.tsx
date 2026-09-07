import Link from "next/link";

import { cn } from "@/lib/utils";

interface MeetLoopBrandMarkProps {
  appearance?: "default" | "inverted";
}

export function MeetLoopBrandMark({ appearance = "default" }: MeetLoopBrandMarkProps) {
  const isInverted = appearance === "inverted";

  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4",
        isInverted
          ? "text-white focus-visible:ring-white focus-visible:ring-offset-neutral-950"
          : "text-neutral-950 focus-visible:ring-neutral-950",
      )}
      aria-label="MeetLoop home"
    >
      <svg viewBox="0 0 36 36" className="size-8" aria-hidden="true">
        <rect width="36" height="36" rx="10" className="fill-current" />
        <path
          d="M8.25 18c0-3.35 1.92-5.75 4.62-5.75C18.15 12.25 18 23.75 23.13 23.75c2.7 0 4.62-2.4 4.62-5.75s-1.92-5.75-4.62-5.75C17.85 12.25 18 23.75 12.87 23.75 10.17 23.75 8.25 21.35 8.25 18Z"
          fill="none"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isInverted ? "stroke-neutral-950" : "stroke-white"}
        />
        <circle
          cx="27.2"
          cy="9.2"
          r="2"
          className={isInverted ? "fill-neutral-950" : "fill-white"}
        />
      </svg>
      <span className="text-[17px] font-bold tracking-[-0.045em]">MeetLoop</span>
    </Link>
  );
}
