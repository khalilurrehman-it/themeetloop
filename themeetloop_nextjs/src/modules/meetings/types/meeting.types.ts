export type MeetingLifecycleStatus =
  "capturing" | "finalizing" | "processing" | "review_required" | "completed" | "failed";
export interface MeetingSummary {
  id: string;
  title: string;
  sourcePlatform: "google_meet" | "manual_demo";
  sourceLanguage: string;
  status: MeetingLifecycleStatus;
  startedAt: string;
  endedAt: string | null;
  captureSessionId: string;
}
export interface TranscriptChunk {
  id?: string;
  sequenceNumber: number;
  capturedAt: string;
  speakerDisplayName: string;
  sourceLanguage: string;
  transcriptText: string;
}
export interface MeetingDetail extends MeetingSummary {
  transcriptChunkCount: number;
  speakerCount: number;
  processing: {
    status: "queued" | "processing" | "completed" | "failed";
    attemptCount: number;
    lastErrorCode: string | null;
  } | null;
}
export type ActionableNoteItemType = "decision" | "action" | "commitment" | "blocker" | "question";
export interface ActionableNoteItem {
  id: string;
  itemType: ActionableNoteItemType;
  content: string;
  ownerDisplayName: string | null;
  dueDate: string | null;
  confidence: number;
  reviewStatus: "pending" | "accepted" | "corrected" | "removed";
  evidenceTranscriptChunkIds: string[];
}
export interface ActionableNotes {
  summary: string;
  detectedLanguages: string[];
  generationWarning: string | null;
  generationProvider: string;
  reviewedAt: string | null;
  items: ActionableNoteItem[];
}
export type ExtensionConnectionStatus =
  "waiting" | "connected" | "reconnecting" | "offline_buffering" | "failed";
