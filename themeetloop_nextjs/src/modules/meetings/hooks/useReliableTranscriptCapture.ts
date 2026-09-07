"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadMeetingTranscript,
  MeetingApiError,
  persistTranscriptBatch,
} from "@/modules/meetings/services/meetingApiClient";
import type {
  ExtensionConnectionStatus,
  MeetingSummary,
  TranscriptChunk,
} from "@/modules/meetings/types/meeting.types";
import {
  extensionMessageSchema,
  transcriptChunkSchema,
} from "@/modules/meetings/validations/meetingValidationSchemas";
import { z } from "zod";

const TRANSCRIPT_BATCH_SIZE = 100;
const TRANSCRIPT_FLUSH_INTERVAL_MILLISECONDS = 1200;
const EXTENSION_HEARTBEAT_TIMEOUT_MILLISECONDS = 8000;
const INITIAL_RETRY_DELAY_MILLISECONDS = 2000;
const MAXIMUM_RETRY_DELAY_MILLISECONDS = 30000;
const MAXIMUM_LOCALLY_BUFFERED_CHUNKS = 5000;
/** Bounds the drain loop so a server that never acknowledges cannot spin forever. */
const MAXIMUM_CONSECUTIVE_BATCHES_PER_DRAIN = 50;

export function useReliableTranscriptCapture(meeting: MeetingSummary | null) {
  const [displayedChunks, setDisplayedChunks] = useState<TranscriptChunk[]>([]);
  const [bufferedChunkCount, setBufferedChunkCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ExtensionConnectionStatus>("waiting");
  const [deliveryErrorMessage, setDeliveryErrorMessage] = useState("");
  const [isLocalBufferPersisted, setIsLocalBufferPersisted] = useState(true);
  const pendingChunksReference = useRef<TranscriptChunk[]>([]);
  const displayedSequenceNumbersReference = useRef(new Set<number>());
  const activeFlushPromiseReference = useRef<Promise<boolean> | null>(null);
  const lastHeartbeatAtReference = useRef(0);
  const consecutiveDeliveryFailureCountReference = useRef(0);
  const nextDeliveryAttemptAtReference = useRef(0);
  const hasTerminalDeliveryErrorReference = useRef(false);

  const bufferStorageKey = meeting
    ? `meetloop.transcript-buffer.${meeting.captureSessionId}`
    : null;

  const persistLocalBuffer = useCallback(
    (chunks: TranscriptChunk[]) => {
      setBufferedChunkCount(chunks.length);
      if (!bufferStorageKey) return;
      try {
        localStorage.setItem(bufferStorageKey, JSON.stringify(chunks));
        setIsLocalBufferPersisted(true);
      } catch {
        // Quota exhausted or storage blocked. The chunks stay in memory and keep being
        // delivered, but the user must be told the crash-safety guarantee is gone.
        setIsLocalBufferPersisted(false);
      }
    },
    [bufferStorageKey],
  );

  const acceptTranscriptChunk = useCallback(
    (chunk: TranscriptChunk) => {
      if (displayedSequenceNumbersReference.current.has(chunk.sequenceNumber)) return;
      if (pendingChunksReference.current.length >= MAXIMUM_LOCALLY_BUFFERED_CHUNKS) {
        setDeliveryErrorMessage(
          "The local caption buffer is full. Reconnect to MeetLoop so buffered captions can be delivered.",
        );
        return;
      }
      displayedSequenceNumbersReference.current.add(chunk.sequenceNumber);
      setDisplayedChunks((current) =>
        [...current, chunk].sort((first, second) => first.sequenceNumber - second.sequenceNumber),
      );
      pendingChunksReference.current = [...pendingChunksReference.current, chunk].sort(
        (first, second) => first.sequenceNumber - second.sequenceNumber,
      );
      persistLocalBuffer(pendingChunksReference.current);
    },
    [persistLocalBuffer],
  );

  const deliverSingleBatch = useCallback(async (): Promise<boolean> => {
    if (!meeting) return false;
    const batch = pendingChunksReference.current.slice(0, TRANSCRIPT_BATCH_SIZE);
    try {
      const acknowledgement = await persistTranscriptBatch(
        meeting.id,
        meeting.captureSessionId,
        batch,
      );
      pendingChunksReference.current = pendingChunksReference.current.filter(
        (chunk) => chunk.sequenceNumber > acknowledgement.highestContiguousSequenceNumber,
      );
      persistLocalBuffer(pendingChunksReference.current);
      consecutiveDeliveryFailureCountReference.current = 0;
      nextDeliveryAttemptAtReference.current = 0;
      hasTerminalDeliveryErrorReference.current = false;
      setDeliveryErrorMessage("");
      setConnectionStatus(lastHeartbeatAtReference.current > 0 ? "connected" : "waiting");
      return true;
    } catch (error) {
      if (error instanceof MeetingApiError && error.status >= 400 && error.status < 500) {
        hasTerminalDeliveryErrorReference.current = true;
        setConnectionStatus("failed");
        setDeliveryErrorMessage(
          `${error.message} (${error.code}). Captions remain stored on this device.`,
        );
        return false;
      }
      consecutiveDeliveryFailureCountReference.current += 1;
      const retryDelay = Math.min(
        INITIAL_RETRY_DELAY_MILLISECONDS *
          2 ** (consecutiveDeliveryFailureCountReference.current - 1),
        MAXIMUM_RETRY_DELAY_MILLISECONDS,
      );
      nextDeliveryAttemptAtReference.current = Date.now() + retryDelay;
      setConnectionStatus("offline_buffering");
      setDeliveryErrorMessage(
        `Captions are safe on this device. Retrying in ${Math.ceil(retryDelay / 1000)} seconds.`,
      );
      return false;
    }
  }, [meeting, persistLocalBuffer]);

  const flushBufferedChunks = useCallback(
    async (forceImmediateAttempt = false): Promise<boolean> => {
      if (!meeting) return true;
      if (activeFlushPromiseReference.current) {
        // Wait for the in-flight attempt, then re-evaluate rather than reporting its result:
        // a periodic flush of one batch must not be mistaken for "everything delivered".
        await activeFlushPromiseReference.current.catch(() => undefined);
      }
      if (pendingChunksReference.current.length === 0) return true;

      // An explicit request (ending the meeting, or a manual retry) clears the terminal
      // latch and the backoff window so the user is never permanently stuck.
      if (forceImmediateAttempt) {
        hasTerminalDeliveryErrorReference.current = false;
        nextDeliveryAttemptAtReference.current = 0;
      }
      if (
        hasTerminalDeliveryErrorReference.current ||
        Date.now() < nextDeliveryAttemptAtReference.current
      )
        return false;

      const flushPromise = (async () => {
        // Drain every buffered batch, not just the first: ending a meeting with more than
        // one batch outstanding must still deliver all of it.
        const maximumBatches = forceImmediateAttempt ? MAXIMUM_CONSECUTIVE_BATCHES_PER_DRAIN : 1;
        for (let batchIndex = 0; batchIndex < maximumBatches; batchIndex += 1) {
          if (pendingChunksReference.current.length === 0) break;
          const chunkCountBeforeDelivery = pendingChunksReference.current.length;
          const wasDelivered = await deliverSingleBatch();
          if (!wasDelivered) return false;
          // Guard against a server that acknowledges nothing, which would otherwise loop.
          if (pendingChunksReference.current.length >= chunkCountBeforeDelivery) break;
        }
        return pendingChunksReference.current.length === 0;
      })();

      activeFlushPromiseReference.current = flushPromise;
      try {
        return await flushPromise;
      } finally {
        activeFlushPromiseReference.current = null;
      }
    },
    [deliverSingleBatch, meeting],
  );

  useEffect(() => {
    if (!meeting || !bufferStorageKey) return;
    const activeMeetingId = meeting.id;
    const activeBufferStorageKey = bufferStorageKey;
    let cancelled = false;
    async function restoreCapture(): Promise<void> {
      let locallyBufferedChunks: unknown = [];
      try {
        const locallyBufferedValue = localStorage.getItem(activeBufferStorageKey);
        locallyBufferedChunks = locallyBufferedValue
          ? (JSON.parse(locallyBufferedValue) as unknown)
          : [];
      } catch {
        try {
          localStorage.removeItem(activeBufferStorageKey);
        } catch {
          // Storage is unavailable entirely; continue with an empty local buffer.
        }
      }
      const parsedLocalChunks = z
        .array(transcriptChunkSchema)
        .max(MAXIMUM_LOCALLY_BUFFERED_CHUNKS)
        .safeParse(locallyBufferedChunks);
      const localChunks = parsedLocalChunks.success ? parsedLocalChunks.data : [];
      const storedChunks = await loadMeetingTranscript(activeMeetingId).catch(() => []);
      if (cancelled) return;
      const combinedChunks = [...storedChunks, ...localChunks]
        .filter(
          (chunk, index, all) =>
            all.findIndex((candidate) => candidate.sequenceNumber === chunk.sequenceNumber) ===
            index,
        )
        .sort((first, second) => first.sequenceNumber - second.sequenceNumber);
      displayedSequenceNumbersReference.current = new Set(
        combinedChunks.map((chunk) => chunk.sequenceNumber),
      );
      pendingChunksReference.current = localChunks;
      setDisplayedChunks(combinedChunks);
      setBufferedChunkCount(localChunks.length);
    }
    void restoreCapture();
    return () => {
      cancelled = true;
    };
  }, [bufferStorageKey, meeting]);

  useEffect(() => {
    const interval = window.setInterval(
      () => void flushBufferedChunks(),
      TRANSCRIPT_FLUSH_INTERVAL_MILLISECONDS,
    );
    return () => window.clearInterval(interval);
  }, [flushBufferedChunks]);
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (
        lastHeartbeatAtReference.current > 0 &&
        Date.now() - lastHeartbeatAtReference.current > EXTENSION_HEARTBEAT_TIMEOUT_MILLISECONDS
      )
        setConnectionStatus((currentStatus) =>
          currentStatus === "failed" || currentStatus === "offline_buffering"
            ? currentStatus
            : "reconnecting",
        );
    }, 2000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!meeting) return;
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
  }, [meeting]);
  useEffect(() => {
    function handleExtensionMessage(event: MessageEvent<unknown>): void {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const parsed = extensionMessageSchema.safeParse(event.data);
      if (!parsed.success) return;
      lastHeartbeatAtReference.current = Date.now();
      setConnectionStatus((currentStatus) =>
        currentStatus === "failed" || currentStatus === "offline_buffering"
          ? currentStatus
          : "connected",
      );
      if (
        parsed.data.messageType === "transcript-chunk" &&
        meeting &&
        parsed.data.meetingId === meeting.id &&
        parsed.data.captureSessionId === meeting.captureSessionId
      )
        acceptTranscriptChunk(parsed.data.chunk);
    }
    window.addEventListener("message", handleExtensionMessage);
    return () => window.removeEventListener("message", handleExtensionMessage);
  }, [acceptTranscriptChunk, meeting]);

  function addDemonstrationCaption(speakerDisplayName: string, transcriptText: string): void {
    const highestSequenceNumber = Math.max(0, ...displayedSequenceNumbersReference.current);
    acceptTranscriptChunk({
      sequenceNumber: highestSequenceNumber + 1,
      capturedAt: new Date().toISOString(),
      speakerDisplayName: speakerDisplayName.trim(),
      sourceLanguage: meeting?.sourceLanguage ?? "en",
      transcriptText: transcriptText.trim(),
    });
  }

  return {
    displayedChunks,
    bufferedChunkCount,
    connectionStatus,
    deliveryErrorMessage,
    isLocalBufferPersisted,
    addDemonstrationCaption,
    flushBufferedChunks,
    retryDelivery: () => flushBufferedChunks(true),
  };
}
