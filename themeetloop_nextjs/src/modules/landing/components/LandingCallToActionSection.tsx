import Link from "next/link";
import { HiArrowRight } from "react-icons/hi2";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingCallToActionSection() {
  return (
    <section className="bg-white px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-neutral-950 px-6 py-14 text-center text-white sm:px-12 sm:py-20">
        <p className="text-sm font-semibold text-neutral-400">Close the loop</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
          Make your next meeting start where the last one ended.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-neutral-400">
          Capture what was said. Turn it into work. Bring the truth forward.
        </p>
        <Link
          href="/register"
          className={cn(
            buttonVariants({ variant: "secondary", size: "lg" }),
            "group mt-8 h-12 gap-2 bg-white px-6 text-[15px] text-neutral-950 hover:bg-neutral-200",
          )}
        >
          Get started free{" "}
          <HiArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
