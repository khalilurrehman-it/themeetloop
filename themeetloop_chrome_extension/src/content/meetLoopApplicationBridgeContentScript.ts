interface CaptureRegistrationWindowMessage {
  source: "meetloop-web-application";
  protocolVersion: 1;
  messageType: "register-active-capture" | "unregister-active-capture";
  meetingId?: string;
  captureSessionId?: string;
}
void chrome.runtime.sendMessage({ messageType: "register-meetloop-application-tab" });
function isCaptureRegistrationWindowMessage(
  value: unknown,
): value is CaptureRegistrationWindowMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "source" in value &&
    value.source === "meetloop-web-application" &&
    "protocolVersion" in value &&
    value.protocolVersion === 1 &&
    "messageType" in value &&
    (value.messageType === "unregister-active-capture" ||
      (value.messageType === "register-active-capture" &&
        "meetingId" in value &&
        typeof value.meetingId === "string" &&
        "captureSessionId" in value &&
        typeof value.captureSessionId === "string"))
  );
}
window.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (event.source !== window || !isCaptureRegistrationWindowMessage(event.data)) return;
  void chrome.runtime.sendMessage(event.data);
});
chrome.runtime.onMessage.addListener((message: unknown) => {
  if (
    !message ||
    typeof message !== "object" ||
    !("messageType" in message) ||
    (message.messageType !== "forwarded-transcript-chunk" &&
      message.messageType !== "forwarded-google-meet-lifecycle")
  )
    return;
  window.postMessage(
    {
      ...message,
      source: "meetloop-chrome-extension",
      protocolVersion: 1,
      messageType:
        message.messageType === "forwarded-transcript-chunk"
          ? "transcript-chunk"
          : "google-meet-lifecycle",
    },
    window.location.origin,
  );
});
window.setInterval(() => {
  window.postMessage(
    {
      source: "meetloop-chrome-extension",
      protocolVersion: 1,
      messageType: "connection-heartbeat",
      sentAt: new Date().toISOString(),
    },
    window.location.origin,
  );
}, 3000);
