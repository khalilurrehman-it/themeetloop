import Image from "next/image";
import Link from "next/link";
import { FaChrome, FaGithub, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { HiArrowUpRight } from "react-icons/hi2";

import { MeetLoopBrandMark } from "@/components/application-layout/MeetLoopBrandMark";
import { LANDING_FOOTER_LINK_GROUPS } from "@/constants/landingNavigationConstants";

const SOCIAL_LINKS = [
  { label: "X", href: "#", icon: FaXTwitter },
  { label: "GitHub", href: "#", icon: FaGithub },
  { label: "LinkedIn", href: "#", icon: FaLinkedinIn },
] as const;

const CAPABILITY_BADGES = [
  { label: "Chrome extension · Google Meet first", icon: FaChrome },
] as const;

export function LandingFooter() {
  return (
    <footer className="w-full shrink-0 border-t border-neutral-300 bg-neutral-100 text-neutral-950">
      {/* One vertical rhythm for the whole footer: bands are `py-12 lg:py-16`, inner blocks
          step on 4 / 6 / 8 / 12, and both card panels share the same padding. */}
      <div className="mx-auto w-full max-w-7xl px-5 pb-8 pt-16 sm:px-8">
        <section className="grid overflow-hidden rounded-3xl border border-neutral-300 bg-white shadow-xl lg:grid-cols-2">
          <div className="flex flex-col justify-between gap-12 bg-neutral-950 p-8 text-white lg:p-12">
            <div className="[&_a]:text-white">
              <MeetLoopBrandMark />
            </div>
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-neutral-500">
                Keep every promise in the loop
              </p>
              <h2 className="mt-4 max-w-xl text-balance text-3xl font-semibold leading-tight tracking-tighter sm:text-4xl lg:text-5xl">
                The meeting ends.
                <br />
                The memory moves forward.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-neutral-400">
                Carry decisions, commitments, and evidence into every conversation that follows.
              </p>
              <Link
                href="/register"
                className="group mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-neutral-950"
              >
                Start remembering
                <HiArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
          {/* Same padding as the dark panel so the card reads as one frame. Square while the
              panels are stacked; on large screens the row height comes from the copy. */}
          <div className="aspect-square bg-neutral-50 p-8 lg:aspect-auto lg:p-12">
            <Image
              src="/images/landing/meetloop-footer-meeting-archive.png"
              alt="Meeting records connected into one continuous evidence archive"
              width={1254}
              height={1254}
              sizes="(max-width: 1024px) calc(100vw - 104px), 520px"
              className="h-full w-full rounded-2xl object-cover"
            />
          </div>
        </section>

        <div className="grid gap-12 border-b border-neutral-300 py-12 lg:grid-cols-2 lg:items-start lg:py-16">
          <div className="max-w-sm">
            <MeetLoopBrandMark />
            <p className="mt-4 text-sm leading-6 text-neutral-600">
              Live conversation becomes accountable work—and the context remains ready for the next
              meeting.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {CAPABILITY_BADGES.map((capabilityBadge) => (
                <li
                  key={capabilityBadge.label}
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-600"
                >
                  <capabilityBadge.icon aria-hidden="true" className="size-3.5 text-neutral-950" />
                  {capabilityBadge.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Flex, not equal grid tracks: each group takes only the width of its longest link,
              so the columns stay close together. One `gap-8` drives both axes. */}
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-8">
            {LANDING_FOOTER_LINK_GROUPS.map((linkGroup) => (
              <div key={linkGroup.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {linkGroup.title}
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {linkGroup.links.map((footerLink) => (
                    <li key={footerLink.label}>
                      <Link
                        href={footerLink.href}
                        className="whitespace-nowrap rounded-sm text-sm text-neutral-700 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
                      >
                        {footerLink.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-6 py-8 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MeetLoop. Built in Pakistan.</p>
          <ul className="flex items-center gap-2">
            {SOCIAL_LINKS.map((socialLink) => (
              <li key={socialLink.label}>
                <Link
                  href={socialLink.href}
                  aria-label={`MeetLoop on ${socialLink.label}`}
                  className="grid size-9 place-items-center rounded-full border border-neutral-300 bg-white text-neutral-600 transition-all hover:-translate-y-0.5 hover:border-neutral-500 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
                >
                  <socialLink.icon className="size-4" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Decorative wordmark, clipped by its own wrapper so the oversized glyphs can never
          introduce a horizontal scrollbar. */}
      <div aria-hidden="true" className="w-full overflow-hidden">
        <p className="select-none px-5 text-center text-7xl font-bold leading-none tracking-tighter text-neutral-200 sm:text-8xl lg:text-9xl">
          MeetLoop
        </p>
      </div>
    </footer>
  );
}
