"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BellRingIcon,
  CaptionsIcon,
  DatabaseIcon,
  LoaderCircleIcon,
  MailIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Trash2Icon,
  UserRoundIcon,
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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { authenticationClient } from "@/modules/authentication/services/authenticationClient";
import {
  readAutomaticCapturePreference,
  writeAutomaticCapturePreference,
} from "@/modules/meetings/services/automaticCapturePreferenceService";
import {
  clearLocalCaptureStorage,
  summarizeLocalCaptureStorage,
  type LocalCaptureStorageSummary,
} from "@/modules/meetings/services/localCaptureStorageService";

const AUTOMATIC_CAPTURE_GUARANTEES = [
  { icon: BellRingIcon, title: "Visible", text: "Chrome shows a notification when capture starts." },
  {
    icon: ShieldCheckIcon,
    title: "On by default",
    text: "Turn it off here and it stays off on this device.",
  },
  { icon: SparklesIcon, title: "Reviewable", text: "Generated outcomes always require your review." },
] as const;

const DETECTION_STEPS = [
  "Join Google Meet and turn on captions.",
  "The first valid caption starts capture.",
  "Captions are buffered until the server acknowledges them.",
  "Leaving the call safely finalizes the meeting.",
] as const;

export function SettingsView() {
  const { data: session, isPending: isSessionPending } = authenticationClient.useSession();
  const [isAutomaticCaptureEnabled, setIsAutomaticCaptureEnabled] = useState<boolean>(false);
  const [hasReadStoredPreferences, setHasReadStoredPreferences] = useState<boolean>(false);
  const [localStorageSummary, setLocalStorageSummary] = useState<LocalCaptureStorageSummary | null>(
    null,
  );
  const [isClearingLocalData, setIsClearingLocalData] = useState<boolean>(false);

  const refreshLocalStorageSummary = useCallback(() => {
    setLocalStorageSummary(summarizeLocalCaptureStorage());
  }, []);

  useEffect(() => {
    // Read after mount so the server-rendered markup and the first client render agree.
    const readPreferencesTimer = window.setTimeout(() => {
      setIsAutomaticCaptureEnabled(readAutomaticCapturePreference());
      refreshLocalStorageSummary();
      setHasReadStoredPreferences(true);
    }, 0);
    return () => window.clearTimeout(readPreferencesTimer);
  }, [refreshLocalStorageSummary]);

  function handleAutomaticCaptureChange(nextEnabled: boolean): void {
    try {
      writeAutomaticCapturePreference(nextEnabled);
      setIsAutomaticCaptureEnabled(nextEnabled);
      toast.success(
        nextEnabled ? "Automatic Google Meet capture enabled." : "Automatic capture turned off.",
      );
    } catch {
      toast.error("This browser blocked MeetLoop from saving the preference.");
    }
  }

  function handleClearLocalCaptureData(): void {
    setIsClearingLocalData(true);
    try {
      clearLocalCaptureStorage();
      refreshLocalStorageSummary();
      toast.success("Buffered captions cleared from this device.");
    } catch {
      toast.error("MeetLoop could not clear the local caption buffer.");
    } finally {
      setIsClearingLocalData(false);
    }
  }

  const hasLocalCaptureData =
    (localStorageSummary?.bufferedTranscriptSessionCount ?? 0) > 0 ||
    (localStorageSummary?.hasActiveMeeting ?? false);

  return (
    <section className="pb-16">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-neutral-500">
        Preferences
      </p>
      <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Control when MeetLoop listens and what stays on this device.
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          <ShieldCheckIcon aria-hidden="true" />
          Privacy first
        </Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Account
            </h2>
            <div className="mt-5 flex items-center gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-neutral-950 text-white">
                <UserRoundIcon aria-hidden="true" className="size-5" />
              </div>
              <div className="min-w-0">
                {isSessionPending ? (
                  <>
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="mt-2 h-4 w-52" />
                  </>
                ) : (
                  <>
                    <p className="truncate font-semibold text-neutral-950">
                      {session?.user.name ?? "Signed in"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-neutral-500">
                      <MailIcon aria-hidden="true" className="size-3.5 shrink-0" />
                      {session?.user.email ?? "—"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div className="flex gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-neutral-950 text-white">
                  <CaptionsIcon aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <label
                    htmlFor="automatic-capture-switch"
                    className="font-semibold text-neutral-950"
                  >
                    Automatic Google Meet capture
                  </label>
                  <p
                    id="automatic-capture-description"
                    className="mt-2 max-w-xl text-sm leading-6 text-neutral-600"
                  >
                    This is on by default. The extension starts MeetLoop after it detects the first
                    live Google Meet caption and safely ends capture when you leave. Turn it off to
                    start every meeting yourself.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "text-xs font-semibold",
                    isAutomaticCaptureEnabled ? "text-neutral-950" : "text-neutral-400",
                  )}
                >
                  {isAutomaticCaptureEnabled ? "On" : "Off"}
                </span>
                {hasReadStoredPreferences ? (
                  <Switch
                    id="automatic-capture-switch"
                    checked={isAutomaticCaptureEnabled}
                    onCheckedChange={handleAutomaticCaptureChange}
                    aria-describedby="automatic-capture-description"
                  />
                ) : (
                  <Skeleton className="h-6 w-11 rounded-full" />
                )}
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {AUTOMATIC_CAPTURE_GUARANTEES.map((guarantee) => {
                const GuaranteeIcon = guarantee.icon;
                return (
                  <div
                    key={guarantee.title}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <GuaranteeIcon aria-hidden="true" className="size-4 text-neutral-600" />
                    <p className="mt-4 text-sm font-semibold">{guarantee.title}</p>
                    <p className="mt-1 text-xs leading-5 text-neutral-500">{guarantee.text}</p>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
              Because capture starts on its own, tell participants that the meeting is being
              captured and obtain their consent whenever your organization or local law requires
              it. Keep one signed-in MeetLoop tab open during the call.
            </p>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex gap-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-700">
                <DatabaseIcon aria-hidden="true" className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-neutral-950">Data on this device</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
                  Captions are buffered in this browser until the server acknowledges them. They are
                  cleared automatically when you log out.
                </p>

                {localStorageSummary === null ? (
                  <Skeleton className="mt-5 h-16 w-full rounded-2xl" />
                ) : (
                  <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-700">
                      <span className="font-semibold tabular-nums">
                        {localStorageSummary.bufferedTranscriptChunkCount}
                      </span>{" "}
                      buffered caption
                      {localStorageSummary.bufferedTranscriptChunkCount === 1 ? "" : "s"} across{" "}
                      <span className="font-semibold tabular-nums">
                        {localStorageSummary.bufferedTranscriptSessionCount}
                      </span>{" "}
                      capture session
                      {localStorageSummary.bufferedTranscriptSessionCount === 1 ? "" : "s"}.
                    </p>
                    {localStorageSummary.hasActiveMeeting && (
                      <p className="mt-1.5 text-xs text-amber-800">
                        A meeting is still marked active on this device.
                      </p>
                    )}
                  </div>
                )}

                <AlertDialog>
                  <AlertDialogTrigger
                    disabled={!hasLocalCaptureData || isClearingLocalData}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "mt-4 h-10 rounded-xl border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800",
                    )}
                  >
                    <Trash2Icon aria-hidden="true" />
                    Clear buffered captions
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear buffered captions?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Captions that have not yet been acknowledged by the server will be deleted
                        from this browser and cannot be recovered. Meetings already saved to your
                        archive are unaffected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogClose
                        className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-xl")}
                      >
                        Keep them
                      </AlertDialogClose>
                      <Button
                        disabled={isClearingLocalData}
                        onClick={handleClearLocalCaptureData}
                        className="h-10 rounded-xl bg-red-600 text-white hover:bg-red-700"
                      >
                        {isClearingLocalData && (
                          <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
                        )}
                        Clear from this device
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </section>
        </div>

        <aside className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            How detection works
          </p>
          <ol className="mt-5 space-y-4">
            {DETECTION_STEPS.map((detectionStep, detectionStepIndex) => (
              <li key={detectionStep} className="flex gap-3 text-sm leading-6 text-neutral-600">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-neutral-950 text-[11px] font-semibold text-white">
                  {detectionStepIndex + 1}
                </span>
                {detectionStep}
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
