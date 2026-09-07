"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { createMeeting } from "@/modules/meetings/services/meetingApiClient";
import { ACTIVE_MEETING_STORAGE_KEY } from "@/modules/meetings/constants/automaticCaptureConstants";
import { readAutomaticCapturePreference } from "@/modules/meetings/services/automaticCapturePreferenceService";

export function AutomaticMeetingCaptureCoordinator() {
  const router = useRouter();
  const isStartingReference = useRef(false);
  useEffect(() => {
    async function handleLifecycle(event: MessageEvent<unknown>): Promise<void> {
      if (event.source !== window || event.origin !== window.location.origin) return;
      if (!event.data || typeof event.data !== "object") return;
      const message = event.data as Record<string, unknown>;
      if (
        message.source !== "meetloop-chrome-extension" ||
        message.messageType !== "google-meet-lifecycle" ||
        message.lifecycleState !== "joined"
      )
        return;
      if (
        !readAutomaticCapturePreference() ||
        localStorage.getItem(ACTIVE_MEETING_STORAGE_KEY) ||
        isStartingReference.current
      )
        return;
      try {
        isStartingReference.current = true;
        const meetingCode =
          typeof message.meetingCode === "string" ? message.meetingCode : "Google Meet";
        const meeting = await createMeeting({
          title: `Google Meet · ${meetingCode}`,
          sourcePlatform: "google_meet",
          sourceLanguage: document.documentElement.lang || "und",
        });
        localStorage.setItem(ACTIVE_MEETING_STORAGE_KEY, JSON.stringify(meeting));
        window.postMessage(
          {
            source: "meetloop-web-application",
            protocolVersion: 1,
            messageType: "register-active-capture",
            meetingId: meeting.id,
            captureSessionId: meeting.captureSessionId,
          },
          window.location.origin,
        );
        toast.success("MeetLoop automatically started capturing.");
        router.push("/live-meeting");
      } catch {
        toast.error("Automatic capture could not start. Open Live meeting to retry.");
      } finally {
        isStartingReference.current = false;
      }
    }
    window.addEventListener("message", handleLifecycle);
    return () => window.removeEventListener("message", handleLifecycle);
  }, [router]);
  return null;
}
