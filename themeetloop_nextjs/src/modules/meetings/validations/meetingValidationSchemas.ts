import { z } from "zod";
export const meetingSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  sourcePlatform: z.enum(["google_meet", "manual_demo"]),
  sourceLanguage: z.string(),
  status: z.enum([
    "capturing",
    "finalizing",
    "processing",
    "review_required",
    "completed",
    "failed",
  ]),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable(),
  captureSessionId: z.string().uuid(),
});
export const transcriptChunkSchema = z.object({
  id: z.string().uuid().optional(),
  sequenceNumber: z.number().int().positive(),
  capturedAt: z.string().datetime(),
  speakerDisplayName: z.string().trim().min(1).max(120),
  sourceLanguage: z.string().trim().min(2).max(35),
  transcriptText: z.string().trim().min(1).max(4000),
});
export const meetingDetailSchema = meetingSummarySchema.extend({
  transcriptChunkCount: z.number().int().nonnegative(),
  speakerCount: z.number().int().nonnegative(),
  processing: z
    .object({
      status: z.enum(["queued", "processing", "completed", "failed"]),
      attemptCount: z.number().int().nonnegative(),
      lastErrorCode: z.string().nullable(),
    })
    .nullable(),
});
export const actionableNotesSchema = z.object({
  summary: z.string(),
  detectedLanguages: z.array(z.string()),
  generationWarning: z.string().nullable(),
  generationProvider: z.string(),
  reviewedAt: z.string().datetime().nullable(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      itemType: z.enum(["decision", "action", "commitment", "blocker", "question"]),
      content: z.string(),
      ownerDisplayName: z.string().nullable(),
      dueDate: z.string().nullable(),
      confidence: z.number(),
      reviewStatus: z.enum(["pending", "accepted", "corrected", "removed"]),
      evidenceTranscriptChunkIds: z.array(z.string().uuid()),
    }),
  ),
});
export const extensionMessageSchema = z.discriminatedUnion("messageType", [
  z.object({
    source: z.literal("meetloop-chrome-extension"),
    protocolVersion: z.literal(1),
    messageType: z.literal("connection-heartbeat"),
    sentAt: z.string().datetime(),
  }),
  z.object({
    source: z.literal("meetloop-chrome-extension"),
    protocolVersion: z.literal(1),
    messageType: z.literal("transcript-chunk"),
    meetingId: z.string().uuid(),
    captureSessionId: z.string().uuid(),
    chunk: transcriptChunkSchema,
  }),
]);
