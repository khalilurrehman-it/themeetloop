import { HiArrowLongRight, HiCheckCircle, HiClock, HiExclamationTriangle } from "react-icons/hi2";

const TIMELINE_EVENTS = [
  {
    date: "Aug 12",
    title: "Commitment created",
    detail: "Ahmed will revise onboarding",
    icon: HiClock,
  },
  {
    date: "Aug 19",
    title: "Progress reported",
    detail: "Flow approved; Urdu copy pending",
    icon: HiExclamationTriangle,
  },
  {
    date: "Aug 26",
    title: "Completed with evidence",
    detail: "Both versions shipped",
    icon: HiCheckCircle,
  },
] as const;

export function LandingMemorySection() {
  return (
    <section
      id="memory"
      className="scroll-mt-20 border-b border-neutral-200 bg-neutral-950 py-24 text-white sm:py-32"
    >
      <div className="mx-auto grid max-w-7xl gap-16 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-10">
        <div>
          <p className="text-sm font-semibold text-neutral-400">Memory, with receipts</p>
          <h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Know what changed—not just what was said.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-400">
            Every commitment keeps its origin, evidence, updates, and corrections. AI suggests
            changes; your team stays in control of the truth.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-neutral-300">
            <span className="rounded-full border border-neutral-700 px-3 py-1.5">Auditable</span>
            <HiArrowLongRight className="text-neutral-600" />
            <span className="rounded-full border border-neutral-700 px-3 py-1.5">Correctable</span>
            <HiArrowLongRight className="text-neutral-600" />
            <span className="rounded-full border border-neutral-700 px-3 py-1.5">Persistent</span>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl sm:p-7">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-5">
            <div>
              <p className="text-sm font-semibold">Onboarding release</p>
              <p className="mt-1 text-xs text-neutral-500">Commitment history</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-950">
              Completed
            </span>
          </div>
          <div className="mt-6 space-y-0">
            {TIMELINE_EVENTS.map((event, index) => (
              <div key={event.date} className="relative flex gap-4 pb-7 last:pb-0">
                <div className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full border border-neutral-700 bg-neutral-900">
                  <event.icon className="size-4 text-neutral-300" />
                </div>
                {index < TIMELINE_EVENTS.length - 1 && (
                  <span className="absolute left-[17px] top-9 h-full w-px bg-neutral-800" />
                )}
                <div className="pt-0.5">
                  <p className="text-xs text-neutral-500">{event.date}</p>
                  <p className="mt-1 text-sm font-medium">{event.title}</p>
                  <p className="mt-1 text-sm text-neutral-400">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
