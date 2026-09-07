import {
  actionableNotesOutputSchema,
  type ActionableNotesOutput,
} from "./actionableNotesOutputSchema.js";

interface SourceTranscriptChunk {
  id: string;
  speakerDisplayName: string;
  sourceLanguage: string;
  transcriptText: string;
}

const itemPatterns = [
  { itemType: "action" as const, pattern: /\b(will|need to|action item|todo|follow up)\b/i },
  { itemType: "decision" as const, pattern: /\b(decided|decision|agreed|we'll use)\b/i },
  { itemType: "commitment" as const, pattern: /\b(i promise|i commit|we commit)\b/i },
  { itemType: "blocker" as const, pattern: /\b(blocked|blocker|cannot proceed|waiting on)\b/i },
  { itemType: "question" as const, pattern: /\?$/ },
];

export function generateDeterministicActionableNotes(
  transcriptChunks: SourceTranscriptChunk[],
): ActionableNotesOutput {
  const meaningfulChunks = transcriptChunks.filter(
    (chunk) => chunk.transcriptText.trim().length > 0,
  );
  const excerpt = meaningfulChunks
    .slice(0, 4)
    .map((chunk) => chunk.transcriptText.trim())
    .join(" ");
  const summary = excerpt
    ? `${excerpt.slice(0, 700)}${excerpt.length > 700 ? "…" : ""}`
    : "No spoken captions were captured for this meeting.";
  const items = meaningfulChunks.flatMap((chunk) => {
    const match = itemPatterns.find(({ pattern }) => pattern.test(chunk.transcriptText.trim()));
    if (!match) return [];
    return [
      {
        itemType: match.itemType,
        content: chunk.transcriptText.trim(),
        ownerDisplayName:
          match.itemType === "action" || match.itemType === "commitment"
            ? chunk.speakerDisplayName
            : null,
        dueDate: null,
        confidence: 0.55,
        evidenceTranscriptChunkIds: [chunk.id],
      },
    ];
  });

  return actionableNotesOutputSchema.parse({
    summary,
    detectedLanguages: [...new Set(meaningfulChunks.map((chunk) => chunk.sourceLanguage))],
    generationWarning:
      "Development extraction is active. Review every outcome before relying on it.",
    items,
  });
}
