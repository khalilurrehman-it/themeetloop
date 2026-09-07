"use client";

import { motion } from "framer-motion";
import { HiLanguage, HiOutlineBolt, HiOutlineLink } from "react-icons/hi2";

const FEATURES = [
  {
    icon: HiOutlineBolt,
    number: "01",
    title: "Capture every word, live",
    description:
      "Follow the conversation as it happens with speaker-aware captions that keep working through a reconnect.",
  },
  {
    icon: HiLanguage,
    number: "02",
    title: "Turn talk into accountable work",
    description:
      "Get decisions, owners, due dates, blockers, and questions—each linked back to the exact moment it was said.",
  },
  {
    icon: HiOutlineLink,
    number: "03",
    title: "Carry context forward",
    description:
      "MeetLoop connects commitments across meetings, so unfinished work cannot quietly disappear between calls.",
  },
] as const;

export function LandingProductFeaturesSection() {
  return (
    <section
      id="product"
      className="scroll-mt-20 border-b border-neutral-200 bg-white py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-neutral-500">One continuous loop</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            From conversation to continuity.
          </h2>
          <p className="mt-5 text-lg leading-8 text-neutral-600">
            Not another folder of summaries. A living record of what your team actually agreed to
            do.
          </p>
        </div>
        <div className="mt-14 grid overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 md:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.article
              key={feature.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.08 }}
              className="group border-b border-neutral-200 bg-white p-7 last:border-b-0 md:border-b-0 md:border-r md:p-8 md:last:border-r-0"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl border border-neutral-200 bg-neutral-50">
                  <feature.icon className="size-5" />
                </span>
                <span className="font-mono text-xs text-neutral-400">{feature.number}</span>
              </div>
              <h3 className="mt-8 text-xl font-semibold tracking-[-0.03em]">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{feature.description}</p>
              <div className="mt-8 h-36 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-4 transition-transform duration-300 group-hover:-translate-y-1">
                {index === 0 && (
                  <div className="space-y-3">
                    <div className="h-2 w-20 rounded-full bg-neutral-300" />
                    <div className="flex gap-2">
                      <span className="size-6 rounded-full bg-neutral-900" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2 w-full rounded-full bg-neutral-200" />
                        <div className="h-2 w-3/4 rounded-full bg-neutral-200" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="size-6 rounded-full bg-neutral-300" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2 w-5/6 rounded-full bg-neutral-200" />
                        <div className="h-2 w-1/2 rounded-full bg-neutral-200" />
                      </div>
                    </div>
                  </div>
                )}
                {index === 1 && (
                  <div className="space-y-2">
                    <div className="rounded-lg border border-neutral-200 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full bg-neutral-950" />
                        <span className="h-2 w-28 rounded-full bg-neutral-300" />
                      </div>
                      <div className="ml-5 mt-2 h-2 w-20 rounded-full bg-neutral-100" />
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full border border-neutral-400" />
                        <span className="h-2 w-24 rounded-full bg-neutral-300" />
                      </div>
                    </div>
                  </div>
                )}
                {index === 2 && (
                  <div className="relative ml-3 space-y-4 border-l border-neutral-300 pl-5">
                    <span className="absolute -left-1.5 top-0 size-3 rounded-full bg-neutral-950 ring-4 ring-neutral-100" />
                    <div>
                      <div className="h-2 w-16 rounded-full bg-neutral-300" />
                      <div className="mt-2 h-2 w-28 rounded-full bg-neutral-200" />
                    </div>
                    <span className="absolute -left-1.5 top-12 size-3 rounded-full bg-white ring-1 ring-neutral-400" />
                    <div>
                      <div className="h-2 w-20 rounded-full bg-neutral-300" />
                      <div className="mt-2 h-2 w-24 rounded-full bg-neutral-200" />
                    </div>
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
