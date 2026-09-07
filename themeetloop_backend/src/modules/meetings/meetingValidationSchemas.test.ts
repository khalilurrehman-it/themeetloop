import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ingestTranscriptBatchRequestSchema } from "./meetingValidationSchemas.js";

const captureSessionId = "6f7f7af4-39a2-4ee4-a662-a5e75f388195";
const validTranscriptChunk = {
  sequenceNumber: 1,
  capturedAt: "2026-09-03T08:00:00.000Z",
  speakerDisplayName: "Demo speaker",
  sourceLanguage: "en",
  transcriptText: "A bounded fictional transcript segment.",
};

describe("ingestTranscriptBatchRequestSchema", () => {
  it("accepts a valid bounded transcript batch", () => {
    const result = ingestTranscriptBatchRequestSchema.safeParse({
      captureSessionId,
      chunks: [validTranscriptChunk],
    });
    assert.equal(result.success, true);
  });

  it("rejects duplicate sequence numbers inside one batch", () => {
    const result = ingestTranscriptBatchRequestSchema.safeParse({
      captureSessionId,
      chunks: [validTranscriptChunk, { ...validTranscriptChunk }],
    });
    assert.equal(result.success, false);
  });

  it("rejects unknown properties and oversized transcript text", () => {
    const result = ingestTranscriptBatchRequestSchema.safeParse({
      captureSessionId,
      unexpectedProperty: true,
      chunks: [{ ...validTranscriptChunk, transcriptText: "x".repeat(4001) }],
    });
    assert.equal(result.success, false);
  });
});
