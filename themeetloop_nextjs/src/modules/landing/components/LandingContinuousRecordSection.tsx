"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function LandingContinuousRecordSection() {
  return (
    <section className="overflow-hidden border-b border-neutral-200 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              The continuous record
            </p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              One thread through every conversation.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-neutral-600 lg:justify-self-end">
            MeetLoop connects the words spoken today with the commitments your team made
            before—without removing people from the decision.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="relative mt-12 overflow-hidden rounded-2xl border border-neutral-300 bg-neutral-100 shadow-[0_24px_80px_-35px_rgba(0,0,0,0.4)] sm:rounded-3xl"
        >
          <Image
            src="/images/landing/meetloop-continuous-meeting-memory.png"
            alt="MeetLoop workflow showing live multilingual transcript, evidence-backed actionable notes, and commitments remembered across meetings"
            width={1536}
            height={1024}
            sizes="(max-width: 1024px) calc(100vw - 40px), 1216px"
            className="h-auto w-full"
          />
        </motion.div>
      </div>
    </section>
  );
}
