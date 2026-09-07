"use client";

import Link from "next/link";
import { useEffect } from "react";
import { HiArrowPath } from "react-icons/hi2";

import { ApplicationStatusPanel } from "@/components/feedback/ApplicationStatusPanel";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ApplicationErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ApplicationErrorPage({ error, reset }: ApplicationErrorPageProps) {
  useEffect(() => {
    // The digest is the only safe correlation handle here: the message may carry user or
    // meeting content, so it is never rendered or logged.
    console.error("landing_page_render_failed", { digest: error.digest });
  }, [error.digest]);

  return (
    <ApplicationStatusPanel
      statusCode="500 · Something broke"
      title="We could not load this page."
      description="The failure was on our side, not yours. Nothing MeetLoop has already recorded was changed. Try again, and if it keeps happening the reference below identifies this failure."
      supportingDetail={error.digest ? `Reference: ${error.digest}` : undefined}
      actions={
        <>
          <Button
            type="button"
            onClick={reset}
            className="group h-11 w-full gap-2 rounded-xl px-6 text-sm sm:w-auto"
          >
            <HiArrowPath className="transition-transform duration-300 group-hover:rotate-180" />
            Try again
          </Button>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 w-full rounded-xl border-neutral-300 bg-white px-6 text-sm sm:w-auto",
            )}
          >
            Back to home
          </Link>
        </>
      }
    />
  );
}
