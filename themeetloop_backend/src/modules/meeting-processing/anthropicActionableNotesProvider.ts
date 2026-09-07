import Anthropic from "@anthropic-ai/sdk";

import { environmentVariables } from "../../configuration/environmentVariablesConfiguration.js";
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

const actionableNotesJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    detectedLanguages: { type: "array", items: { type: "string" } },
    generationWarning: { anyOf: [{ type: "string" }, { type: "null" }] },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          itemType: {
            type: "string",
            enum: ["decision", "action", "commitment", "blocker", "question"],
          },
          content: { type: "string" },
          ownerDisplayName: { anyOf: [{ type: "string" }, { type: "null" }] },
          dueDate: { anyOf: [{ type: "string" }, { type: "null" }] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          evidenceTranscriptChunkIds: { type: "array", items: { type: "string" }, minItems: 1 },
        },
        required: [
          "itemType",
          "content",
          "ownerDisplayName",
          "dueDate",
          "confidence",
          "evidenceTranscriptChunkIds",
        ],
      },
    },
  },
  required: ["summary", "detectedLanguages", "generationWarning", "items"],
} as const;

/**
 * Character budget for the transcript placed in the prompt. A capture session is capped at
 * ingestion, but a single long meeting can still exceed a sensible per-request cost, so the
 * middle is dropped and the omission is reported back to the reviewer.
 */
const MAXIMUM_TRANSCRIPT_CHARACTERS = 240_000;

function serializeTranscriptChunk(chunk: SourceTranscriptChunk): string {
  return JSON.stringify({
    chunkId: chunk.id,
    speaker: chunk.speakerDisplayName,
    language: chunk.sourceLanguage,
    text: chunk.transcriptText,
  });
}

/**
 * Keeps the opening and the closing of the meeting when the transcript is too long: the
 * agenda tends to sit at the start and the decisions at the end, so dropping the tail would
 * silently lose the most important outcomes.
 */
function buildBoundedTranscript(transcriptChunks: SourceTranscriptChunk[]): {
  transcript: string;
  omittedChunkCount: number;
} {
  const serializedChunks = transcriptChunks.map(serializeTranscriptChunk);
  const totalCharacters = serializedChunks.reduce((total, line) => total + line.length + 1, 0);
  if (totalCharacters <= MAXIMUM_TRANSCRIPT_CHARACTERS)
    return { transcript: serializedChunks.join("\n"), omittedChunkCount: 0 };

  const halfBudget = MAXIMUM_TRANSCRIPT_CHARACTERS / 2;
  const openingLines: string[] = [];
  let openingCharacters = 0;
  for (const line of serializedChunks) {
    if (openingCharacters + line.length + 1 > halfBudget) break;
    openingLines.push(line);
    openingCharacters += line.length + 1;
  }

  const closingLines: string[] = [];
  let closingCharacters = 0;
  for (let index = serializedChunks.length - 1; index >= openingLines.length; index -= 1) {
    const line = serializedChunks[index];
    if (line === undefined || closingCharacters + line.length + 1 > halfBudget) break;
    closingLines.unshift(line);
    closingCharacters += line.length + 1;
  }

  const omittedChunkCount = serializedChunks.length - openingLines.length - closingLines.length;
  return {
    transcript: [
      ...openingLines,
      `{"note":"${omittedChunkCount} transcript chunks omitted from the middle of this meeting because it exceeded the processing limit."}`,
      ...closingLines,
    ].join("\n"),
    omittedChunkCount,
  };
}

export async function generateAnthropicActionableNotes(
  transcriptChunks: SourceTranscriptChunk[],
): Promise<ActionableNotesOutput> {
  if (!environmentVariables.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY_NOT_CONFIGURED");
  const client = new Anthropic({
    apiKey: environmentVariables.ANTHROPIC_API_KEY,
    timeout: 45_000,
    maxRetries: 1,
  });
  const allowedChunkIds = new Set(transcriptChunks.map((chunk) => chunk.id));
  const { transcript, omittedChunkCount } = buildBoundedTranscript(transcriptChunks);
  const response = await client.messages.create({
    model: environmentVariables.ANTHROPIC_MODEL,
    max_tokens: 4096,
    system:
      "You extract faithful, reviewable meeting outcomes from multilingual transcripts, including English, Urdu, Roman Urdu, and code-switching. Never invent an owner, deadline, decision, or evidence ID. Preserve meaning in the language used by the speakers. Distinguish: decision=an agreed choice; action=a task someone should do; commitment=an explicit promise; blocker=an obstacle; question=an unresolved question. Omit uncertain items instead of guessing.",
    messages: [
      {
        role: "user",
        content: `Create a concise meeting summary and actionable outcomes. Every item must cite one or more exact chunkId values from the transcript. Use null when owner or due date was not explicitly stated. Transcript chunks:\n${transcript || "[No captions captured]"}`,
      },
    ],
    output_config: { format: { type: "json_schema", schema: actionableNotesJsonSchema } },
  });
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("ANTHROPIC_TEXT_OUTPUT_MISSING");
  const output = actionableNotesOutputSchema.parse(JSON.parse(textBlock.text) as unknown);
  if (
    output.items.some((item) =>
      item.evidenceTranscriptChunkIds.some((id) => !allowedChunkIds.has(id)),
    )
  )
    throw new Error("ANTHROPIC_EVIDENCE_IDENTIFIER_INVALID");

  // The reviewer must be able to see that part of the meeting was never read by the model.
  if (omittedChunkCount > 0) {
    const truncationWarning = `This meeting was too long to process in full: ${omittedChunkCount} transcript chunks from the middle were not read. Review the transcript directly for anything decided in that period.`;
    return {
      ...output,
      generationWarning: output.generationWarning
        ? `${truncationWarning} ${output.generationWarning}`
        : truncationWarning,
    };
  }
  return output;
}
