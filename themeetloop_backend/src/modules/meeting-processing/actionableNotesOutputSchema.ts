import { z } from "zod";

export const actionableNoteItemTypeSchema = z.enum([
  "decision",
  "action",
  "commitment",
  "blocker",
  "question",
]);

export const actionableNotesOutputSchema = z
  .object({
    summary: z.string().trim().min(1).max(12_000),
    detectedLanguages: z.array(z.string().trim().min(2).max(35)).max(12),
    generationWarning: z.string().trim().min(1).max(500).nullable(),
    items: z
      .array(
        z
          .object({
            itemType: actionableNoteItemTypeSchema,
            content: z.string().trim().min(1).max(2_000),
            ownerDisplayName: z.string().trim().min(1).max(120).nullable(),
            dueDate: z.iso.date().nullable(),
            confidence: z.number().min(0).max(1),
            evidenceTranscriptChunkIds: z.array(z.uuid()).min(1).max(20),
          })
          .strict(),
      )
      .max(100),
  })
  .strict();

export type ActionableNotesOutput = z.infer<typeof actionableNotesOutputSchema>;
