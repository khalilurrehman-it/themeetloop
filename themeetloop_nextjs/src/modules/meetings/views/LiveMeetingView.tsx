"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CaptionsIcon,
  CheckCircle2Icon,
  LoaderCircleIcon,
  LockKeyholeIcon,
  RadioIcon,
  SendHorizonalIcon,
  SparklesIcon,
  SquareIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ExtensionConnectionStatusPanel } from "@/modules/meetings/components/ExtensionConnectionStatusPanel";
import { useReliableTranscriptCapture } from "@/modules/meetings/hooks/useReliableTranscriptCapture";
import { createMeeting, finalizeMeeting } from "@/modules/meetings/services/meetingApiClient";
import { formatMeetingClockTime } from "@/modules/meetings/transformers/meetingTimestampFormatting";
import type { MeetingSummary } from "@/modules/meetings/types/meeting.types";
import { meetingSummarySchema } from "@/modules/meetings/validations/meetingValidationSchemas";
import { ACTIVE_MEETING_STORAGE_KEY } from "@/modules/meetings/constants/automaticCaptureConstants";

const LIVE_CAPTURE_BENEFITS = [
  {
    icon: CaptionsIcon,
    title: "Captions stay local-first",
    text: "Unsent captions remain buffered on this device until the server acknowledges them.",
  },
  {
    icon: LockKeyholeIcon,
    title: "You stay in control",
    text: "Capture only ends when you end it, so nothing is processed behind your back.",
  },
  {
    icon: CheckCircle2Icon,
    title: "Nothing is blindly trusted",
    text: "Every generated outcome enters a review queue with its transcript evidence.",
  },
] as const;

export function LiveMeetingView() {
  const router = useRouter();
  const [activeMeeting, setActiveMeeting] = useState<MeetingSummary | null>(null);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [demonstrationSpeaker, setDemonstrationSpeaker] = useState("You");
  const [demonstrationCaption, setDemonstrationCaption] = useState("");
  const [isStartingMeeting, setIsStartingMeeting] = useState(false);
  const [isEndingMeeting, setIsEndingMeeting] = useState(false);
  const [startMeetingErrorMessage, setStartMeetingErrorMessage] = useState("");
  const capture = useReliableTranscriptCapture(activeMeeting);
  const automaticEndMeetingReference = useRef<() => void>(() => undefined);
  const transcriptEndReference = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = localStorage.getItem(ACTIVE_MEETING_STORAGE_KEY);
      if (!stored) return;
      try {
        const parsed = meetingSummarySchema.safeParse(JSON.parse(stored) as unknown);
        if (parsed.success && parsed.data.status === "capturing") setActiveMeeting(parsed.data);
        else localStorage.removeItem(ACTIVE_MEETING_STORAGE_KEY);
      } catch {
        localStorage.removeItem(ACTIVE_MEETING_STORAGE_KEY);
      }
    });
  }, []);

  useEffect(() => {
    transcriptEndReference.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [capture.displayedChunks.length]);

  async function startMeeting(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (meetingTitle.trim().length < 2) {
      setStartMeetingErrorMessage("Enter a meeting title of at least two characters.");
      return;
    }
    try {
      setIsStartingMeeting(true);
      setStartMeetingErrorMessage("");
      const meeting = await createMeeting({
        title: meetingTitle.trim(),
        sourcePlatform: "google_meet",
        sourceLanguage: "en",
      });
      localStorage.setItem(ACTIVE_MEETING_STORAGE_KEY, JSON.stringify(meeting));
      setActiveMeeting(meeting);
      toast.success("Live meeting started.");
    } catch {
      setStartMeetingErrorMessage(
        "MeetLoop could not start this meeting. Check your connection and try again.",
      );
      toast.error("Meeting could not be started.");
    } finally {
      setIsStartingMeeting(false);
    }
  }

  function addDemonstrationCaption(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!demonstrationSpeaker.trim() || !demonstrationCaption.trim()) return;
    capture.addDemonstrationCaption(demonstrationSpeaker, demonstrationCaption);
    setDemonstrationCaption("");
  }

  async function endMeeting(): Promise<void> {
    if (!activeMeeting || isEndingMeeting) return;
    try {
      setIsEndingMeeting(true);
      const wasFullyDelivered = await capture.flushBufferedChunks(true);
      if (!wasFullyDelivered) {
        toast.error(
          capture.deliveryErrorMessage ||
            "Captions are still being delivered. Check the status panel and try again.",
        );
        return;
      }
      await finalizeMeeting(activeMeeting.id);
      const completedMeetingId = activeMeeting.id;
      localStorage.removeItem(ACTIVE_MEETING_STORAGE_KEY);
      window.postMessage(
        {
          source: "meetloop-web-application",
          protocolVersion: 1,
          messageType: "unregister-active-capture",
        },
        window.location.origin,
      );
      setActiveMeeting(null);
      toast.success("Meeting saved. Creating actionable notes…");
      router.push(`/meetings/${completedMeetingId}`);
    } catch {
      toast.error("MeetLoop could not end the meeting safely. Your captions are still buffered.");
    } finally {
      setIsEndingMeeting(false);
    }
  }

  useEffect(() => {
    automaticEndMeetingReference.current = () => void endMeeting();
  });

  useEffect(() => {
    function handleLifecycle(event: MessageEvent<unknown>): void {
      if (event.source !== window || event.origin !== window.location.origin) return;
      if (!event.data || typeof event.data !== "object") return;
      const message = event.data as Record<string, unknown>;
      if (
        message.source === "meetloop-chrome-extension" &&
        message.messageType === "google-meet-lifecycle" &&
        message.lifecycleState === "ended"
      )
        window.setTimeout(() => automaticEndMeetingReference.current(), 3000);
    }
    window.addEventListener("message", handleLifecycle);
    return () => window.removeEventListener("message", handleLifecycle);
  }, []);

  if (!activeMeeting)
    return (
      <section className="mx-auto max-w-5xl pb-16">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Live capture
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Start a meeting</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          MeetLoop creates the meeting before capture begins, so every accepted caption has a
          durable destination from the first word.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <form
            onSubmit={startMeeting}
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <label htmlFor="meeting-title" className="text-sm font-semibold text-neutral-900">
              Meeting title
            </label>
            <p id="meeting-title-hint" className="mt-1 text-xs text-neutral-500">
              Used to find this meeting later in your archive.
            </p>
            <Input
              id="meeting-title"
              value={meetingTitle}
              maxLength={160}
              required
              aria-describedby={
                startMeetingErrorMessage ? "meeting-title-error" : "meeting-title-hint"
              }
              aria-invalid={startMeetingErrorMessage.length > 0}
              onChange={(event) => {
                setMeetingTitle(event.target.value);
                setStartMeetingErrorMessage("");
              }}
              placeholder="Weekly product sync"
              className="mt-3 h-11 rounded-xl border-neutral-300 px-3.5 text-sm"
            />
            {startMeetingErrorMessage && (
              <p id="meeting-title-error" role="alert" className="mt-2 text-sm text-red-700">
                {startMeetingErrorMessage}
              </p>
            )}
            <Button
              type="submit"
              disabled={isStartingMeeting}
              className="mt-5 h-11 rounded-xl px-5"
            >
              {isStartingMeeting ? (
                <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
              ) : (
                <CaptionsIcon aria-hidden="true" />
              )}
              {isStartingMeeting ? "Starting meeting…" : "Start meeting"}
            </Button>
          </form>
          <aside className="rounded-3xl bg-neutral-950 p-6 text-white">
            <SparklesIcon aria-hidden="true" className="size-6 text-amber-300" />
            <h2 className="mt-8 text-xl font-semibold tracking-tight">
              From live words to useful work
            </h2>
            <div className="mt-6 space-y-5">
              {LIVE_CAPTURE_BENEFITS.map((benefit) => {
                const BenefitIcon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10">
                      <BenefitIcon aria-hidden="true" className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{benefit.title}</p>
                      <p className="mt-1 text-xs leading-5 text-neutral-400">{benefit.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </section>
    );

  return (
    <section className="pb-16">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-600">
            <RadioIcon aria-hidden="true" className="size-4 animate-pulse" />
            Capturing live
          </div>
          <h1 className="mt-3 truncate text-3xl font-semibold tracking-tight">
            {activeMeeting.title}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {capture.displayedChunks.length} caption
            {capture.displayedChunks.length === 1 ? "" : "s"} captured ·{" "}
            {capture.bufferedChunkCount} awaiting delivery
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger
            disabled={isEndingMeeting}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 shrink-0 rounded-xl border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800",
            )}
          >
            <SquareIcon aria-hidden="true" />
            {isEndingMeeting ? "Ending meeting…" : "End meeting"}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End this meeting?</AlertDialogTitle>
              <AlertDialogDescription>
                MeetLoop will deliver the {capture.bufferedChunkCount} buffered caption
                {capture.bufferedChunkCount === 1 ? "" : "s"} still on this device, then start
                generating actionable notes. Capture cannot be resumed afterwards.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose
                className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-xl")}
              >
                Keep capturing
              </AlertDialogClose>
              <Button
                onClick={() => void endMeeting()}
                disabled={isEndingMeeting}
                className="h-10 rounded-xl"
              >
                {isEndingMeeting && (
                  <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
                )}
                End and save
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ExtensionConnectionStatusPanel
        connectionStatus={capture.connectionStatus}
        bufferedChunkCount={capture.bufferedChunkCount}
        deliveryErrorMessage={capture.deliveryErrorMessage}
        isLocalBufferPersisted={capture.isLocalBufferPersisted}
        onRetryDelivery={() => void capture.retryDelivery()}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="rounded-2xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-neutral-100 px-5 py-4">
            <h2 className="font-semibold tracking-tight">Live transcript</h2>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium tabular-nums text-neutral-600">
              {capture.displayedChunks.length}
            </span>
          </div>
          {capture.displayedChunks.length === 0 ? (
            <div className="grid min-h-80 place-items-center px-6 text-center">
              <div>
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-neutral-100">
                  <CaptionsIcon aria-hidden="true" className="size-6 text-neutral-400" />
                </div>
                <p className="mt-4 text-sm font-medium text-neutral-900">
                  Waiting for the first caption
                </p>
                <p className="mx-auto mt-1.5 max-w-xs text-xs leading-5 text-neutral-500">
                  Turn on captions in Google Meet, or use the demo input to see the loop work.
                </p>
              </div>
            </div>
          ) : (
            <ol
              aria-live="polite"
              aria-relevant="additions"
              className="max-h-[32rem] space-y-1 overflow-y-auto p-3"
            >
              {capture.displayedChunks.map((chunk) => (
                <li
                  key={chunk.sequenceNumber}
                  className="grid gap-1 rounded-xl px-2 py-2.5 transition-colors hover:bg-neutral-50 sm:grid-cols-[132px_1fr] sm:gap-4"
                >
                  <div className="flex items-baseline gap-2 sm:block">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {chunk.speakerDisplayName}
                    </p>
                    <p className="text-xs tabular-nums text-neutral-400">
                      {formatMeetingClockTime(chunk.capturedAt)}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-neutral-700">{chunk.transcriptText}</p>
                </li>
              ))}
              <div ref={transcriptEndReference} />
            </ol>
          )}
        </div>

        <form
          onSubmit={addDemonstrationCaption}
          className="h-fit rounded-2xl border border-neutral-200 bg-white p-5"
        >
          <h2 className="font-semibold tracking-tight">Demo caption input</h2>
          <p className="mt-2 text-xs leading-5 text-neutral-500">
            Use this to exercise the full loop while the Chrome extension is not connected.
          </p>
          <label htmlFor="demonstration-speaker" className="mt-4 block text-xs font-semibold">
            Speaker
          </label>
          <Input
            id="demonstration-speaker"
            value={demonstrationSpeaker}
            maxLength={120}
            onChange={(event) => setDemonstrationSpeaker(event.target.value)}
            className="mt-2 h-10 rounded-xl border-neutral-300 px-3 text-sm"
          />
          <label htmlFor="demonstration-caption" className="mt-4 block text-xs font-semibold">
            Caption
          </label>
          <Input
            id="demonstration-caption"
            value={demonstrationCaption}
            maxLength={4000}
            placeholder="What was just said…"
            onChange={(event) => setDemonstrationCaption(event.target.value)}
            className="mt-2 h-10 rounded-xl border-neutral-300 px-3 text-sm"
          />
          <Button
            type="submit"
            disabled={!demonstrationSpeaker.trim() || !demonstrationCaption.trim()}
            className="mt-4 h-10 w-full rounded-xl"
          >
            <SendHorizonalIcon aria-hidden="true" />
            Add caption
          </Button>
        </form>
      </div>
    </section>
  );
}
