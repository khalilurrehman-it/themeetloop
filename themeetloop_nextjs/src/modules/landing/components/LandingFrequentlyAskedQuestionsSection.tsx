import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const QUESTIONS = [
  {
    question: "Does MeetLoop record meeting audio?",
    answer:
      "The first release captures Google Meet captions in real time. Audio transcription is planned as a separate capability, so MeetLoop is transparent about which source produced your transcript.",
  },
  {
    question: "Which languages are supported first?",
    answer:
      "The initial experience focuses on English, Urdu script, Roman Urdu, and English-Urdu code-switched conversations, with the original captured text always preserved.",
  },
  {
    question: "Can AI incorrectly mark work as completed?",
    answer:
      "MeetLoop stores evidence and proposes sensitive status changes for review. Your team can correct an owner, due date, note, or status without erasing the original history.",
  },
  {
    question: "How does memory work across meetings?",
    answer:
      "Commitments receive a stable history. When later evidence reports progress, a blocker, or completion, MeetLoop links that update to the original commitment and the exact source conversation.",
  },
] as const;

export function LandingFrequentlyAskedQuestionsSection() {
  return (
    <section
      id="frequently-asked-questions"
      className="scroll-mt-20 border-b border-neutral-200 bg-white py-24 sm:py-32"
    >
      <div className="mx-auto grid max-w-5xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="text-sm font-semibold text-neutral-500">FAQ</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">The honest answers.</h2>
          <p className="mt-4 text-sm leading-6 text-neutral-600">
            Clear about what MeetLoop does today—and how it protects the truth in your meeting
            history.
          </p>
        </div>
        <Accordion className="border-t border-neutral-200">
          {QUESTIONS.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger className="py-5 text-base hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="max-w-2xl pb-5 pr-8 leading-6 text-neutral-600">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
