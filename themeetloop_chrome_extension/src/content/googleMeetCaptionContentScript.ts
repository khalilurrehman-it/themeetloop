interface CaptionElementState {
  latestObservedText: string;
  lastEmittedText: string;
  settleTimeoutId: number | undefined;
}

/**
 * Google Meet grows a caption element's text as the speaker talks and only then moves on to
 * a new element. Tracking state per element (rather than a global set of seen strings) means
 * a phrase repeated later in the meeting is still captured, while the intermediate partial
 * states of a single utterance are not sent as separate chunks.
 */
const captionElementStates = new WeakMap<Element, CaptionElementState>();
const CAPTION_SETTLE_DELAY_MILLISECONDS = 900;
let meetingLifecycleStarted = false;
const CAPTURE_INDICATOR_ELEMENT_ID = "meetloop-capture-status-indicator";

function updateCaptureIndicator(status: "ready" | "detected" | "capturing" | "finalizing"): void {
  let indicator = document.getElementById(CAPTURE_INDICATOR_ELEMENT_ID);
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = CAPTURE_INDICATOR_ELEMENT_ID;
    Object.assign(indicator.style, {
      position: "fixed",
      left: "18px",
      bottom: "18px",
      zIndex: "2147483647",
      padding: "10px 14px",
      borderRadius: "999px",
      background: "#171717",
      color: "#fff",
      font: "600 12px/1.2 system-ui, sans-serif",
      boxShadow: "0 10px 30px rgba(0,0,0,.28)",
      transition: "all .2s ease",
    });
    document.documentElement.appendChild(indicator);
  }
  const labels = {
    ready: "MeetLoop ready · turn on captions",
    detected: "MeetLoop · captions detected",
    capturing: "MeetLoop · capturing securely",
    finalizing: "MeetLoop · saving final captions",
  };
  indicator.textContent = labels[status];
  indicator.style.background =
    status === "capturing" ? "#166534" : status === "finalizing" ? "#92400e" : "#171717";
}

updateCaptureIndicator("ready");

function sendMeetingLifecycleEvent(lifecycleState: "joined" | "ended"): void {
  void chrome.runtime.sendMessage({
    messageType: "google-meet-lifecycle",
    lifecycleState,
    meetingCode: window.location.pathname.split("/").filter(Boolean)[0] ?? "google-meet",
    occurredAt: new Date().toISOString(),
  });
}

function readCaptionCandidate(
  element: Element,
): { speakerDisplayName: string; transcriptText: string } | null {
  const transcriptText = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
  if (transcriptText.length === 0 || transcriptText.length > 4000) return null;
  const container = element.closest("[aria-live], [role='region']") ?? element.parentElement;
  const speakerCandidate = container
    ?.querySelector("[data-self-name], [class*='speaker'], [class*='name']")
    ?.textContent?.trim();
  return {
    speakerDisplayName: speakerCandidate?.slice(0, 120) || "Unknown speaker",
    transcriptText,
  };
}

/**
 * The sequence number is deliberately omitted: the background service worker assigns it, so
 * numbering survives a reload of this content script and never collides with stored chunks.
 */
function emitSettledCaption(speakerDisplayName: string, transcriptText: string): void {
  void chrome.runtime.sendMessage({
    messageType: "google-meet-caption",
    chunk: {
      capturedAt: new Date().toISOString(),
      speakerDisplayName,
      sourceLanguage: document.documentElement.lang || "und",
      transcriptText,
    },
  });
}

function scanGoogleMeetCaptionMutations(): void {
  const captionCandidates = document.querySelectorAll(
    "[data-message-text], [role='region'][aria-label*='Captions' i] [dir='auto'], [aria-live='polite'] [dir='auto'], [aria-live='assertive'] [dir='auto']",
  );
  captionCandidates.forEach((element) => {
    const caption = readCaptionCandidate(element);
    if (!caption) return;
    if (!meetingLifecycleStarted) {
      meetingLifecycleStarted = true;
      updateCaptureIndicator("detected");
      sendMeetingLifecycleEvent("joined");
    }

    const existingState = captionElementStates.get(element);
    if (existingState?.lastEmittedText === caption.transcriptText) return;
    if (existingState?.latestObservedText === caption.transcriptText) return;

    if (existingState?.settleTimeoutId !== undefined)
      window.clearTimeout(existingState.settleTimeoutId);

    const settleTimeoutId = window.setTimeout(() => {
      const settledState = captionElementStates.get(element);
      if (!settledState || settledState.lastEmittedText === settledState.latestObservedText) return;
      captionElementStates.set(element, {
        latestObservedText: settledState.latestObservedText,
        lastEmittedText: settledState.latestObservedText,
        settleTimeoutId: undefined,
      });
      emitSettledCaption(caption.speakerDisplayName, settledState.latestObservedText);
    }, CAPTION_SETTLE_DELAY_MILLISECONDS);

    captionElementStates.set(element, {
      latestObservedText: caption.transcriptText,
      lastEmittedText: existingState?.lastEmittedText ?? "",
      settleTimeoutId,
    });
  });
}

const captionMutationObserver = new MutationObserver(scanGoogleMeetCaptionMutations);
captionMutationObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
});
scanGoogleMeetCaptionMutations();

document.addEventListener(
  "click",
  (event) => {
    const target = event.target instanceof Element ? event.target.closest("button") : null;
    const accessibleLabel = target?.getAttribute("aria-label")?.toLowerCase() ?? "";
    if (
      meetingLifecycleStarted &&
      (accessibleLabel.includes("leave call") || accessibleLabel.includes("leave meeting"))
    )
      sendMeetingLifecycleEvent("ended");
  },
  true,
);
window.addEventListener("pagehide", (event) => {
  // A bfcache-eligible pagehide is a navigation the user can come straight back from, so it
  // must not be reported as the meeting ending.
  if (meetingLifecycleStarted && !event.persisted) sendMeetingLifecycleEvent("ended");
});

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (!message || typeof message !== "object" || !("messageType" in message)) return;
  if (message.messageType === "meetloop-capture-active") updateCaptureIndicator("capturing");
  if (message.messageType === "meetloop-capture-finalizing") updateCaptureIndicator("finalizing");
});
