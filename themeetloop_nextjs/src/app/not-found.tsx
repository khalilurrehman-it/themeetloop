import Link from "next/link";
import type { Metadata } from "next";
import { HiArrowRight } from "react-icons/hi2";

import { ApplicationStatusPanel } from "@/components/feedback/ApplicationStatusPanel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFoundPage() {
  return (
    <ApplicationStatusPanel
      statusCode="404 · Not found"
      title="This page is not in the loop."
      description="The link may be out of date, or the page may have moved. Everything MeetLoop remembers is still where you left it."
      actions={
        <>
          <Link
            href="/"
            className={cn(
              buttonVariants(),
              "group h-11 w-full gap-2 rounded-xl px-6 text-sm sm:w-auto",
            )}
          >
            Back to home
            <HiArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 w-full rounded-xl border-neutral-300 bg-white px-6 text-sm sm:w-auto",
            )}
          >
            Log in
          </Link>
        </>
      }
    />
  );
}
