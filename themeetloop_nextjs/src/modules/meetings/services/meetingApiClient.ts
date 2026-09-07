import { z } from "zod";
import { publicEnvironment } from "@/configuration/publicEnvironmentConfiguration";
import type {
  ActionableNotes,
  MeetingDetail,
  MeetingSummary,
  TranscriptChunk,
} from "@/modules/meetings/types/meeting.types";
import {
  meetingSummarySchema,
  transcriptChunkSchema,
  meetingDetailSchema,
  actionableNotesSchema,
} from "@/modules/meetings/validations/meetingValidationSchemas";
const apiEnvelopeSchema = <ResponseSchema extends z.ZodType>(schema: ResponseSchema) =>
  z.object({
    success: z.literal(true),
    data: schema,
    meta: z.object({ requestId: z.string().optional() }),
  });
const apiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
});
export class MeetingApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "MeetingApiError";
  }
}
async function requestMeetingApi<Response>(
  path: string,
  schema: z.ZodType<Response>,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(
    `${publicEnvironment.NEXT_PUBLIC_BACKEND_API_BASE_URL}/api/v1${path}`,
    {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
    },
  );
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = apiErrorEnvelopeSchema.safeParse(body);
    throw new MeetingApiError(
      error.success ? error.data.error.code : "UNEXPECTED_API_ERROR",
      error.success ? error.data.error.message : "MeetLoop could not complete the request",
      response.status,
    );
  }
  return apiEnvelopeSchema(schema).parse(body).data;
}
export function createMeeting(input: {
  title: string;
  sourcePlatform: "google_meet" | "manual_demo";
  sourceLanguage: string;
}): Promise<MeetingSummary> {
  return requestMeetingApi("/meetings", meetingSummarySchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
export function listMeetings(): Promise<MeetingSummary[]> {
  return requestMeetingApi("/meetings", z.array(meetingSummarySchema));
}
export function loadMeetingDetail(meetingId: string): Promise<MeetingDetail> {
  return requestMeetingApi(`/meetings/${meetingId}`, meetingDetailSchema);
}
export function loadActionableNotes(meetingId: string): Promise<ActionableNotes> {
  return requestMeetingApi(`/meetings/${meetingId}/actionable-notes`, actionableNotesSchema);
}
export function updateActionableNoteItem(
  meetingId: string,
  itemId: string,
  input: {
    reviewStatus: "accepted" | "corrected" | "removed";
    content?: string;
    ownerDisplayName?: string | null;
    dueDate?: string | null;
  },
): Promise<{ updated: true }> {
  return requestMeetingApi(
    `/meetings/${meetingId}/actionable-notes/items/${itemId}`,
    z.object({ updated: z.literal(true) }),
    { method: "PATCH", body: JSON.stringify(input) },
  );
}
export function markActionableNotesReviewed(meetingId: string): Promise<{ status: "completed" }> {
  return requestMeetingApi(
    `/meetings/${meetingId}/actionable-notes/review`,
    z.object({ status: z.literal("completed") }),
    { method: "POST", body: "{}" },
  );
}
export function retryMeetingProcessing(meetingId: string): Promise<{ status: "queued" }> {
  return requestMeetingApi(
    `/meetings/${meetingId}/retry-processing`,
    z.object({ status: z.literal("queued") }),
    { method: "POST", body: "{}" },
  );
}
export function loadMeetingTranscript(meetingId: string): Promise<TranscriptChunk[]> {
  return requestMeetingApi(`/meetings/${meetingId}/transcript`, z.array(transcriptChunkSchema));
}
export function persistTranscriptBatch(
  meetingId: string,
  captureSessionId: string,
  chunks: TranscriptChunk[],
): Promise<{ highestContiguousSequenceNumber: number; storedChunkCount: number }> {
  return requestMeetingApi(
    `/meetings/${meetingId}/transcript-batches`,
    z.object({
      highestContiguousSequenceNumber: z.number().int().nonnegative(),
      storedChunkCount: z.number().int().nonnegative(),
    }),
    { method: "POST", body: JSON.stringify({ captureSessionId, chunks }) },
  );
}
export function finalizeMeeting(
  meetingId: string,
): Promise<{ meetingId: string; status: "finalizing" }> {
  return requestMeetingApi(
    `/meetings/${meetingId}/finalize`,
    z.object({ meetingId: z.string().uuid(), status: z.literal("finalizing") }),
    { method: "POST", body: "{}" },
  );
}
