"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { HiArrowRight } from "react-icons/hi2";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRODUCT_VALUE_ITEMS = [
  { title: "Live", description: "Follow every word" },
  { title: "Actionable", description: "Know what happens next" },
  { title: "Persistent", description: "Carry context forward" },
] as const;

export function LandingHeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-neutral-200 bg-white">
      <div
        className="landing-grid-background absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_88%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-24 sm:px-8 sm:pb-24 sm:pt-32 lg:px-10 lg:pb-28 lg:pt-40">
        {/* Single stacked column at every breakpoint: copy first, product image beneath. */}
        <div className="flex flex-col items-center gap-14">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-3xl text-center"
          >
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
              The meeting memory layer
            </p>
            <h1 className="mt-5 text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-neutral-950 sm:text-6xl lg:text-7xl">
              Your meetings should remember what your team forgets.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-7 tracking-[-0.01em] text-neutral-600 sm:text-lg">
              Live multilingual transcription, actionable notes, and a shared memory that carries
              every commitment into the next meeting.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
              <Link
                href="/register"
                className={cn(
                  buttonVariants(),
                  "group h-11 w-full gap-2 rounded-xl px-6 text-sm shadow-sm sm:w-auto",
                )}
              >
                Start remembering{" "}
                <HiArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#product"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 w-full rounded-xl border-neutral-300 bg-white px-6 text-sm sm:w-auto",
                )}
              >
                See how it works
              </Link>
            </div>
            <p className="mt-4 text-xs text-neutral-500">Chrome extension · Google Meet first</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className="relative mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-5xl"
          >
            <div className="absolute inset-10 -z-10 rounded-full bg-neutral-200/80 blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_28px_90px_-38px_rgba(0,0,0,0.35)] sm:rounded-3xl">
              <Image
                src="/images/landing/meetloop-hero-meeting-memory.png"
                alt="MeetLoop product concept connecting live transcription, action items, and cross-meeting memory"
                width={1456}
                height={1086}
                priority
                sizes="(max-width: 1024px) calc(100vw - 40px), 1024px"
                className="h-auto w-full"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: [0, -7, 0], rotate: [0, -0.6, 0], scale: 1 }}
              transition={{
                opacity: { duration: 0.35, delay: 0.7 },
                scale: { type: "spring", stiffness: 260, damping: 20, delay: 0.65 },
                y: { duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.9 },
                rotate: { duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.9 },
              }}
              className="absolute -bottom-5 left-5 min-w-44 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 shadow-[0_16px_35px_-14px_rgba(0,0,0,0.3)] sm:left-8 sm:min-w-48 sm:px-5 sm:py-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Memory linked
              </p>
              <p className="mt-1.5 text-xs font-semibold tracking-[-0.01em] sm:text-sm">
                3 meetings · 1 commitment
              </p>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-14 grid grid-cols-3 divide-x divide-neutral-200 border-y border-neutral-200 bg-white/75 py-5 text-center backdrop-blur-sm sm:mt-16 lg:mt-20">
          {PRODUCT_VALUE_ITEMS.map((valueItem) => (
            <div key={valueItem.title} className="px-2 sm:px-6">
              <p className="text-xs font-semibold sm:text-sm">{valueItem.title}</p>
              <p className="mt-1 hidden text-xs text-neutral-500 sm:block">
                {valueItem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
