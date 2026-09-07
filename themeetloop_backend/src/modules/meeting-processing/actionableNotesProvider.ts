import { environmentVariables } from "../../configuration/environmentVariablesConfiguration.js";
import { generateAnthropicActionableNotes } from "./anthropicActionableNotesProvider.js";
import { generateDeterministicActionableNotes } from "./deterministicActionableNotesProvider.js";
import type { ActionableNotesOutput } from "./actionableNotesOutputSchema.js";

interface SourceTranscriptChunk {
  id: string;
  speakerDisplayName: string;
  sourceLanguage: string;
  transcriptText: string;
}
export async function generateActionableNotes(
  chunks: SourceTranscriptChunk[],
): Promise<{ output: ActionableNotesOutput; provider: string }> {
  if (environmentVariables.ANTHROPIC_API_KEY)
    return {
      output: await generateAnthropicActionableNotes(chunks),
      provider: `anthropic:${environmentVariables.ANTHROPIC_MODEL}`,
    };
  if (environmentVariables.NODE_ENV === "production")
    throw new Error("ANTHROPIC_API_KEY_NOT_CONFIGURED");
  return {
    output: generateDeterministicActionableNotes(chunks),
    provider: "deterministic-development-v1",
  };
}
