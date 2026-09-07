import {
  ACTIVE_MEETING_STORAGE_KEY,
  AUTOMATIC_GOOGLE_MEET_CAPTURE_ENABLED_STORAGE_KEY,
} from "@/modules/meetings/constants/automaticCaptureConstants";

const TRANSCRIPT_BUFFER_KEY_PREFIX = "meetloop.transcript-buffer.";

function readLocalStorageKeys(): string[] {
  try {
    return Object.keys(localStorage);
  } catch {
    // Storage can be blocked entirely (private mode, embedded contexts).
    return [];
  }
}

export interface LocalCaptureStorageSummary {
  bufferedTranscriptSessionCount: number;
  bufferedTranscriptChunkCount: number;
  hasActiveMeeting: boolean;
}

export function summarizeLocalCaptureStorage(): LocalCaptureStorageSummary {
  let bufferedTranscriptSessionCount = 0;
  let bufferedTranscriptChunkCount = 0;

  for (const storageKey of readLocalStorageKeys()) {
    if (!storageKey.startsWith(TRANSCRIPT_BUFFER_KEY_PREFIX)) continue;
    bufferedTranscriptSessionCount += 1;
    try {
      const storedValue = localStorage.getItem(storageKey);
      const parsedValue: unknown = storedValue ? JSON.parse(storedValue) : [];
      if (Array.isArray(parsedValue)) bufferedTranscriptChunkCount += parsedValue.length;
    } catch {
      // A corrupt entry still counts as one session worth clearing.
    }
  }

  let hasActiveMeeting = false;
  try {
    hasActiveMeeting = localStorage.getItem(ACTIVE_MEETING_STORAGE_KEY) !== null;
  } catch {
    hasActiveMeeting = false;
  }

  return { bufferedTranscriptSessionCount, bufferedTranscriptChunkCount, hasActiveMeeting };
}

/**
 * Removes every MeetLoop capture artefact from this browser.
 *
 * Buffered captions are meeting content, so they must not outlive the session on a shared
 * device. The automatic-capture preference is deliberately preserved unless the caller asks
 * for it, because it is a setting rather than meeting data.
 */
export function clearLocalCaptureStorage(options?: { includePreferences?: boolean }): void {
  for (const storageKey of readLocalStorageKeys()) {
    if (!storageKey.startsWith(TRANSCRIPT_BUFFER_KEY_PREFIX)) continue;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Nothing further can be done for this key; continue clearing the rest.
    }
  }

  try {
    localStorage.removeItem(ACTIVE_MEETING_STORAGE_KEY);
    if (options?.includePreferences)
      localStorage.removeItem(AUTOMATIC_GOOGLE_MEET_CAPTURE_ENABLED_STORAGE_KEY);
  } catch {
    // Storage unavailable; there is nothing persisted to clear.
  }
}
