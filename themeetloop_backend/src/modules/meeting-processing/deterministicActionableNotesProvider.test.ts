import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateDeterministicActionableNotes } from "./deterministicActionableNotesProvider.js";

describe("generateDeterministicActionableNotes", () => {
  it("creates evidence-linked actions from transcript chunks", () => {
    const chunkId = "a16ab7d9-78d4-4c6d-a7ea-d3e1f405ddc9";
    const result = generateDeterministicActionableNotes([
      {
        id: chunkId,
        speakerDisplayName: "Amina",
        sourceLanguage: "en",
        transcriptText: "I will send the revised proposal tomorrow.",
      },
    ]);
    assert.equal(result.items[0]?.itemType, "action");
    assert.deepEqual(result.items[0]?.evidenceTranscriptChunkIds, [chunkId]);
  });
  it("returns an explicit empty transcript summary", () => {
    const result = generateDeterministicActionableNotes([]);
    assert.equal(result.items.length, 0);
    assert.match(result.summary, /No spoken captions/);
  });
});
