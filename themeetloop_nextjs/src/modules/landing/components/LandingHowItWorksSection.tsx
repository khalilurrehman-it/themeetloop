import { FaChrome } from "react-icons/fa6";
import { HiOutlineDocumentCheck, HiOutlineSparkles } from "react-icons/hi2";

const STEPS = [
  {
    icon: FaChrome,
    title: "Join your meeting",
    description:
      "The Chrome extension captures Google Meet captions while you stay focused on the conversation.",
  },
  {
    icon: HiOutlineDocumentCheck,
    title: "Review clear outcomes",
    description:
      "MeetLoop organizes decisions and commitments with owners, deadlines, and source evidence.",
  },
  {
    icon: HiOutlineSparkles,
    title: "Start the next call informed",
    description:
      "Open commitments and earlier decisions return when they matter, without another recap.",
  },
] as const;

export function LandingHowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-b border-neutral-200 bg-neutral-50 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-semibold text-neutral-500">How it works</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Three steps. Zero lost context.
          </h2>
        </div>
        <ol className="relative mt-16 grid gap-5 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-neutral-950 text-white">
                  <step.icon className="size-5" />
                </span>
                <span className="text-3xl font-semibold tracking-[-0.05em] text-neutral-200">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-8 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
