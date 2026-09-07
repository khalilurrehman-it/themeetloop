import type { PoolClient } from "pg";

import { postgresqlConnectionPool } from "../../infrastructure/database/postgresqlConnectionPool.js";
import { logApplicationEvent } from "../../infrastructure/logging/structuredApplicationLogger.js";
import { generateActionableNotes } from "./actionableNotesProvider.js";

const PROCESSING_INTERVAL_MILLISECONDS = 3_000;
let processingInterval: NodeJS.Timeout | undefined;
let missingSchemaWasReported = false;
let isProcessingTickRunning = false;
let consecutiveInfrastructureFailureCount = 0;
let nextWorkerAttemptAt = 0;

async function claimNextJob(client: PoolClient): Promise<{ id: string; meetingId: string } | null> {
  await client.query("begin");
  const result = await client.query<{ id: string; meeting_id: string }>(
    `select id, meeting_id from meeting_processing_jobs
     where (status = 'queued' and next_attempt_at <= now())
        or (status = 'processing' and locked_at < now() - interval '2 minutes')
     order by created_at for update skip locked limit 1`,
  );
  const job = result.rows[0];
  if (!job) {
    await client.query("commit");
    return null;
  }
  await client.query(
    "update meeting_processing_jobs set status = 'processing', attempt_count = attempt_count + 1, locked_at = now(), updated_at = now() where id = $1",
    [job.id],
  );
  await client.query(
    "update meetings set status = 'processing', updated_at = now() where id = $1",
    [job.meeting_id],
  );
  await client.query("commit");
  return { id: job.id, meetingId: job.meeting_id };
}

async function processNextJob(): Promise<void> {
  if (isProcessingTickRunning || Date.now() < nextWorkerAttemptAt) return;
  isProcessingTickRunning = true;
  let client: PoolClient | undefined;
  let connectionShouldBeDiscarded = false;
  let claimedJob: { id: string; meetingId: string } | null = null;
  try {
    client = await postgresqlConnectionPool.connect();
    claimedJob = await claimNextJob(client);
    consecutiveInfrastructureFailureCount = 0;
    nextWorkerAttemptAt = 0;
    if (!claimedJob) return;
    const transcriptResult = await client.query<{
      id: string;
      speaker_display_name: string;
      source_language: string;
      transcript_text: string;
    }>(
      "select id, speaker_display_name, source_language, transcript_text from meeting_transcript_chunks where meeting_id = $1 order by sequence_number",
      [claimedJob.meetingId],
    );
    const generation = await generateActionableNotes(
      transcriptResult.rows.map((row) => ({
        id: row.id,
        speakerDisplayName: row.speaker_display_name,
        sourceLanguage: row.source_language,
        transcriptText: row.transcript_text,
      })),
    );
    const output = generation.output;

    await client.query("begin");
    const notesResult = await client.query<{ id: string }>(
      `insert into meeting_actionable_notes (meeting_id, summary, detected_languages, generation_warning, generation_provider)
       values ($1, $2, $3::jsonb, $4, $5)
       on conflict (meeting_id) do update set summary = excluded.summary, detected_languages = excluded.detected_languages,
       generation_warning = excluded.generation_warning, generation_provider = excluded.generation_provider, updated_at = now()
       returning id`,
      [
        claimedJob.meetingId,
        output.summary,
        JSON.stringify(output.detectedLanguages),
        output.generationWarning,
        generation.provider,
      ],
    );
    const actionableNotesId = notesResult.rows[0]?.id;
    if (!actionableNotesId) throw new Error("ACTIONABLE_NOTES_IDENTIFIER_MISSING");
    await client.query("delete from meeting_actionable_note_items where actionable_notes_id = $1", [
      actionableNotesId,
    ]);
    for (const [displayOrder, item] of output.items.entries()) {
      const itemResult = await client.query<{ id: string }>(
        `insert into meeting_actionable_note_items
         (actionable_notes_id, item_type, content, owner_display_name, due_date, confidence, display_order)
         values ($1,$2,$3,$4,$5,$6,$7) returning id`,
        [
          actionableNotesId,
          item.itemType,
          item.content,
          item.ownerDisplayName,
          item.dueDate,
          item.confidence,
          displayOrder,
        ],
      );
      const itemId = itemResult.rows[0]?.id;
      for (const transcriptChunkId of item.evidenceTranscriptChunkIds) {
        await client.query(
          "insert into meeting_actionable_note_evidence (actionable_note_item_id, transcript_chunk_id) values ($1,$2)",
          [itemId, transcriptChunkId],
        );
      }
    }
    await client.query(
      "update meetings set status = 'review_required', updated_at = now() where id = $1",
      [claimedJob.meetingId],
    );
    await client.query(
      "update meeting_processing_jobs set status = 'completed', completed_at = now(), locked_at = null, updated_at = now() where id = $1",
      [claimedJob.id],
    );
    await client.query("commit");
  } catch (error) {
    connectionShouldBeDiscarded = true;
    await client?.query("rollback").catch(() => undefined);
    if (claimedJob && client) {
      try {
        await client.query(
          `update meeting_processing_jobs set status = case when attempt_count >= 3 then 'failed' else 'queued' end,
           next_attempt_at = now() + make_interval(secs => attempt_count * attempt_count * 5),
           last_error_code = 'PROCESSING_FAILED', locked_at = null, updated_at = now() where id = $1`,
          [claimedJob.id],
        );
        await client.query(
          `update meetings set status = case when (select attempt_count from meeting_processing_jobs where id = $2) >= 3 then 'failed' else 'finalizing' end, updated_at = now() where id = $1`,
          [claimedJob.meetingId, claimedJob.id],
        );
      } catch (recoveryError) {
        logApplicationEvent(
          "error",
          "meeting_processing_recovery_deferred",
          { meetingId: claimedJob.meetingId, jobId: claimedJob.id },
          recoveryError,
        );
      }
    }
    const databaseErrorCode = error instanceof Error && "code" in error ? String(error.code) : null;
    if (databaseErrorCode === "42P01") {
      if (!missingSchemaWasReported)
        logApplicationEvent(
          "error",
          "meeting_processing_schema_unavailable",
          {
            resolution:
              "Run pnpm --filter themeetloop_backend database:migrate, then restart the backend.",
          },
          error,
        );
      missingSchemaWasReported = true;
      stopMeetingProcessingWorker();
    } else {
      consecutiveInfrastructureFailureCount += 1;
      const retryDelayMilliseconds = Math.min(
        5_000 * 2 ** (consecutiveInfrastructureFailureCount - 1),
        60_000,
      );
      nextWorkerAttemptAt = Date.now() + retryDelayMilliseconds;
      logApplicationEvent(
        claimedJob ? "error" : "warn",
        claimedJob ? "meeting_processing_failed" : "meeting_processing_database_unavailable",
        {
          meetingId: claimedJob?.meetingId ?? null,
          jobId: claimedJob?.id ?? null,
          errorCode: "PROCESSING_FAILED",
          retryDelayMilliseconds,
        },
        error,
      );
    }
  } finally {
    client?.release(connectionShouldBeDiscarded);
    isProcessingTickRunning = false;
  }
}

export function startMeetingProcessingWorker(): void {
  if (processingInterval) return;
  void processNextJob();
  processingInterval = setInterval(() => void processNextJob(), PROCESSING_INTERVAL_MILLISECONDS);
}

export function stopMeetingProcessingWorker(): void {
  if (processingInterval) clearInterval(processingInterval);
  processingInterval = undefined;
}
