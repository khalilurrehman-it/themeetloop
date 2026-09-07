interface ActiveCaptureDestination {
  meetingId: string;
  captureSessionId: string;
  applicationTabId: number;
}
interface CaptionSequenceState {
  captureSessionId: string;
  nextSequenceNumber: number;
}
let activeCaptureDestination: ActiveCaptureDestination | null = null;
let applicationTabId: number | null = null;
let googleMeetTabId: number | null = null;
const ACTIVE_CAPTURE_STORAGE_KEY = "meetloopActiveCaptureDestination";
const PENDING_CAPTIONS_STORAGE_KEY = "meetloopPendingCaptionMessages";
const CAPTION_SEQUENCE_STORAGE_KEY = "meetloopCaptionSequenceState";
const MAXIMUM_PENDING_CAPTION_MESSAGES = 500;
let pendingCaptionMessages: unknown[] = [];
/**
 * Sequence numbers are owned here rather than in the content script: the content script is
 * torn down whenever the Google Meet tab reloads, and a counter that restarts at 1 collides
 * with already-stored chunks, which the server then silently discards.
 */
let captionSequenceState: CaptionSequenceState | null = null;

void chrome.storage.local.get(ACTIVE_CAPTURE_STORAGE_KEY).then((stored) => {
  const candidate = stored[ACTIVE_CAPTURE_STORAGE_KEY];
  if (candidate && typeof candidate === "object")
    activeCaptureDestination = candidate as ActiveCaptureDestination;
});
void chrome.storage.local.get(PENDING_CAPTIONS_STORAGE_KEY).then((stored) => {
  const candidate = stored[PENDING_CAPTIONS_STORAGE_KEY];
  if (Array.isArray(candidate))
    pendingCaptionMessages = candidate.slice(-MAXIMUM_PENDING_CAPTION_MESSAGES);
});
void chrome.storage.local.get(CAPTION_SEQUENCE_STORAGE_KEY).then((stored) => {
  const candidate = stored[CAPTION_SEQUENCE_STORAGE_KEY];
  if (
    candidate &&
    typeof candidate === "object" &&
    typeof (candidate as CaptionSequenceState).captureSessionId === "string" &&
    typeof (candidate as CaptionSequenceState).nextSequenceNumber === "number"
  )
    captionSequenceState = candidate as CaptionSequenceState;
});

function claimNextSequenceNumber(captureSessionId: string): number {
  if (!captionSequenceState || captionSequenceState.captureSessionId !== captureSessionId)
    captionSequenceState = { captureSessionId, nextSequenceNumber: 1 };
  const sequenceNumber = captionSequenceState.nextSequenceNumber;
  captionSequenceState = { captureSessionId, nextSequenceNumber: sequenceNumber + 1 };
  void chrome.storage.local.set({ [CAPTION_SEQUENCE_STORAGE_KEY]: captionSequenceState });
  return sequenceNumber;
}

function buildForwardedTranscriptChunkMessage(
  captionMessage: unknown,
  destination: ActiveCaptureDestination,
): Record<string, unknown> | null {
  if (!captionMessage || typeof captionMessage !== "object") return null;
  const candidate = captionMessage as { chunk?: Record<string, unknown> };
  if (!candidate.chunk || typeof candidate.chunk !== "object") return null;
  return {
    messageType: "forwarded-transcript-chunk",
    meetingId: destination.meetingId,
    captureSessionId: destination.captureSessionId,
    chunk: {
      ...candidate.chunk,
      sequenceNumber: claimNextSequenceNumber(destination.captureSessionId),
    },
  };
}

chrome.runtime.onMessage.addListener((message: unknown, sender) => {
  if (!message || typeof message !== "object" || !("messageType" in message)) return;
  if (
    (message.messageType === "google-meet-caption" ||
      message.messageType === "google-meet-lifecycle") &&
    sender.tab?.id !== undefined
  )
    googleMeetTabId = sender.tab.id;
  if (message.messageType === "register-meetloop-application-tab" && sender.tab?.id !== undefined) {
    applicationTabId = sender.tab.id;
    return;
  }
  if (
    message.messageType === "register-active-capture" &&
    "meetingId" in message &&
    "captureSessionId" in message &&
    sender.tab?.id !== undefined &&
    typeof message.meetingId === "string" &&
    typeof message.captureSessionId === "string"
  ) {
    const registeredDestination: ActiveCaptureDestination = {
      meetingId: message.meetingId,
      captureSessionId: message.captureSessionId,
      applicationTabId: sender.tab.id,
    };
    activeCaptureDestination = registeredDestination;
    applicationTabId = sender.tab.id;
    void chrome.storage.local.set({ [ACTIVE_CAPTURE_STORAGE_KEY]: activeCaptureDestination });
    if (googleMeetTabId !== null)
      void chrome.tabs
        .sendMessage(googleMeetTabId, { messageType: "meetloop-capture-active" })
        .catch(() => undefined);
    void chrome.notifications
      .create({
        type: "basic",
        iconUrl: "icons/icon-128.png",
        title: "MeetLoop is capturing",
        message: "Google Meet captions are being saved to your meeting memory.",
      })
      .catch(() => undefined);
    for (const pendingCaptionMessage of pendingCaptionMessages) {
      const forwardedMessage = buildForwardedTranscriptChunkMessage(
        pendingCaptionMessage,
        registeredDestination,
      );
      if (forwardedMessage)
        void chrome.tabs
          .sendMessage(registeredDestination.applicationTabId, forwardedMessage)
          .catch(() => undefined);
    }
    pendingCaptionMessages = [];
    void chrome.storage.local.remove(PENDING_CAPTIONS_STORAGE_KEY);
    return;
  }
  if (message.messageType === "unregister-active-capture") {
    if (googleMeetTabId !== null)
      void chrome.tabs
        .sendMessage(googleMeetTabId, { messageType: "meetloop-capture-finalizing" })
        .catch(() => undefined);
    activeCaptureDestination = null;
    captionSequenceState = null;
    void chrome.storage.local.remove([ACTIVE_CAPTURE_STORAGE_KEY, CAPTION_SEQUENCE_STORAGE_KEY]);
    return;
  }
  if (message.messageType === "google-meet-caption" && !activeCaptureDestination) {
    pendingCaptionMessages = [
      ...pendingCaptionMessages.slice(-(MAXIMUM_PENDING_CAPTION_MESSAGES - 1)),
      message,
    ];
    void chrome.storage.local.set({ [PENDING_CAPTIONS_STORAGE_KEY]: pendingCaptionMessages });
    return;
  }
  if (message.messageType === "google-meet-caption" && activeCaptureDestination) {
    const destination = activeCaptureDestination;
    const forwardedMessage = buildForwardedTranscriptChunkMessage(message, destination);
    if (forwardedMessage)
      void chrome.tabs
        .sendMessage(destination.applicationTabId, forwardedMessage)
        .catch(() => {
          activeCaptureDestination = null;
        });
  }
  if (message.messageType === "google-meet-lifecycle" && applicationTabId !== null) {
    void chrome.tabs
      .sendMessage(applicationTabId, {
        ...message,
        messageType: "forwarded-google-meet-lifecycle",
      })
      .catch(() => undefined);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (applicationTabId === tabId) applicationTabId = null;
  if (googleMeetTabId === tabId) googleMeetTabId = null;
  if (activeCaptureDestination?.applicationTabId === tabId) {
    activeCaptureDestination = null;
    void chrome.storage.local.remove(ACTIVE_CAPTURE_STORAGE_KEY);
  }
});
