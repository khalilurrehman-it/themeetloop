import { z } from "zod";

export const meetingIdentifierSchema = z.string().uuid();
export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(16)
  .max(100)
  .regex(/^[A-Za-z0-9._:-]+$/);

export const createMeetingRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    sourcePlatform: z.enum(["google_meet", "manual_demo"]),
    sourceLanguage: z.string().trim().min(2).max(35),
  })
  .strict();

export const transcriptChunkSchema = z
  .object({
    sequenceNumber: z.number().int().positive().max(2_147_483_647),
    capturedAt: z.string().datetime({ offset: true }),
    speakerDisplayName: z.string().trim().min(1).max(120),
    sourceLanguage: z.string().trim().min(2).max(35),
    transcriptText: z.string().trim().min(1).max(4000),
  })
  .strict();

export const ingestTranscriptBatchRequestSchema = z
  .object({
    captureSessionId: z.string().uuid(),
    chunks: z.array(transcriptChunkSchema).min(1).max(100),
  })
  .strict()
  .superRefine((request, refinementContext) => {
    const sequenceNumbers = request.chunks.map((chunk) => chunk.sequenceNumber);
    if (new Set(sequenceNumbers).size !== sequenceNumbers.length) {
      refinementContext.addIssue({
        code: "custom",
        message: "Sequence numbers must be unique within a batch",
        path: ["chunks"],
      });
    }
  });

export const updateActionableNoteItemRequestSchema = z
  .object({
    reviewStatus: z.enum(["accepted", "corrected", "removed"]),
    content: z.string().trim().min(1).max(2000).optional(),
    ownerDisplayName: z.string().trim().min(1).max(120).nullable().optional(),
    dueDate: z.iso.date().nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.reviewStatus === "corrected" && !value.content)
      context.addIssue({
        code: "custom",
        message: "Corrected content is required",
        path: ["content"],
      });
  });
export const actionableNoteItemIdentifierSchema = z.string().uuid();

export type CreateMeetingRequest = z.infer<typeof createMeetingRequestSchema>;
export type IngestTranscriptBatchRequest = z.infer<typeof ingestTranscriptBatchRequestSchema>;
export type UpdateActionableNoteItemRequest = z.infer<typeof updateActionableNoteItemRequestSchema>;
