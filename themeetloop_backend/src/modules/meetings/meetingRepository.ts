import type { PoolClient } from "pg";

import { postgresqlConnectionPool } from "../../infrastructure/database/postgresqlConnectionPool.js";
import type {
  CreateMeetingRequest,
  IngestTranscriptBatchRequest,
  UpdateActionableNoteItemRequest,
} from "./meetingValidationSchemas.js";

/**
 * Roughly eight hours of continuous captioning. Beyond this a capture session is almost
 * certainly a runaway client, and every stored chunk is later billed to the notes provider.
 */
export const MAXIMUM_TRANSCRIPT_CHUNKS_PER_SESSION = 20_000;

export interface MeetingSummary {
  id: string;
  title: string;
  sourcePlatform: string;
  sourceLanguage: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  captureSessionId: string;
}

async function resolveOrCreatePersonalWorkspace(
  client: PoolClient,
  userId: string,
  userName: string,
): Promise<string> {
  const existingMembership = await client.query<{ workspace_id: string }>(
    "select workspace_id from workspace_members where user_id = $1 and role = 'owner' limit 1",
    [userId],
  );
  const existingWorkspaceId = existingMembership.rows[0]?.workspace_id;
  if (existingWorkspaceId) return existingWorkspaceId;

  const workspaceResult = await client.query<{ id: string }>(
    "insert into workspaces (name) values ($1) returning id",
    [`${userName.trim().slice(0, 100) || "My"}'s workspace`],
  );
  const workspaceId = workspaceResult.rows[0]?.id;
  if (!workspaceId) throw new Error("Workspace creation returned no identifier");
  await client.query(
    "insert into workspace_members (workspace_id, user_id, role) values ($1, $2, 'owner')",
    [workspaceId, userId],
  );
  return workspaceId;
}

export async function createMeeting(
  userId: string,
  userName: string,
  request: CreateMeetingRequest,
): Promise<MeetingSummary> {
  const client = await postgresqlConnectionPool.connect();
  try {
    await client.query("begin");
    const workspaceId = await resolveOrCreatePersonalWorkspace(client, userId, userName);
    const meetingResult = await client.query<{ id: string; started_at: Date }>(
      "insert into meetings (workspace_id, created_by_user_id, title, source_platform, source_language) values ($1, $2, $3, $4, $5) returning id, started_at",
      [workspaceId, userId, request.title, request.sourcePlatform, request.sourceLanguage],
    );
    const meeting = meetingResult.rows[0];
    if (!meeting) throw new Error("Meeting creation returned no record");
    const captureResult = await client.query<{ id: string }>(
      "insert into meeting_capture_sessions (meeting_id) values ($1) returning id",
      [meeting.id],
    );
    const captureSessionId = captureResult.rows[0]?.id;
    if (!captureSessionId) throw new Error("Capture session creation returned no record");
    await client.query("commit");
    return {
      id: meeting.id,
      title: request.title,
      sourcePlatform: request.sourcePlatform,
      sourceLanguage: request.sourceLanguage,
      status: "capturing",
      startedAt: meeting.started_at.toISOString(),
      endedAt: null,
      captureSessionId,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function listMeetings(userId: string): Promise<MeetingSummary[]> {
  const result = await postgresqlConnectionPool.query<{
    id: string;
    title: string;
    source_platform: string;
    source_language: string;
    status: string;
    started_at: Date;
    ended_at: Date | null;
    capture_session_id: string;
  }>(
    `select m.id, m.title, m.source_platform, m.source_language, m.status, m.started_at, m.ended_at, cs.id as capture_session_id from meetings m join workspace_members wm on wm.workspace_id = m.workspace_id join lateral (select id from meeting_capture_sessions where meeting_id = m.id order by created_at desc limit 1) cs on true where wm.user_id = $1 order by m.started_at desc limit 100`,
    [userId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    sourcePlatform: row.source_platform,
    sourceLanguage: row.source_language,
    status: row.status,
    startedAt: row.started_at.toISOString(),
    endedAt: row.ended_at?.toISOString() ?? null,
    captureSessionId: row.capture_session_id,
  }));
}

export async function ingestTranscriptBatch(
  userId: string,
  meetingId: string,
  request: IngestTranscriptBatchRequest,
): Promise<{ highestContiguousSequenceNumber: number; storedChunkCount: number }> {
  const client = await postgresqlConnectionPool.connect();
  try {
    await client.query("begin");
    const authorizationResult = await client.query<{ status: string; ended_at: Date | null }>(
      `select m.status, m.ended_at from meetings m join workspace_members wm on wm.workspace_id = m.workspace_id join meeting_capture_sessions cs on cs.meeting_id = m.id where m.id = $1 and cs.id = $2 and wm.user_id = $3 for update`,
      [meetingId, request.captureSessionId, userId],
    );
    const authorizedMeeting = authorizationResult.rows[0];
    if (
      !authorizedMeeting ||
      (authorizedMeeting.status !== "capturing" && authorizedMeeting.status !== "finalizing")
    )
      return Promise.reject(new MeetingRepositoryError("MEETING_NOT_CAPTURING"));
    const meetingEndedAtMilliseconds = authorizedMeeting.ended_at?.getTime();
    if (
      meetingEndedAtMilliseconds !== undefined &&
      request.chunks.some(
        (chunk) => new Date(chunk.capturedAt).getTime() > meetingEndedAtMilliseconds,
      )
    )
      return Promise.reject(new MeetingRepositoryError("TRANSCRIPT_AFTER_MEETING_END"));

    // A capture session must not be able to grow without bound: the whole transcript is
    // later sent to the notes provider, so an unbounded session is unbounded cost.
    const storedChunkCountResult = await client.query<{ stored_chunk_count: string }>(
      "select count(*)::text stored_chunk_count from meeting_transcript_chunks where capture_session_id = $1",
      [request.captureSessionId],
    );
    const alreadyStoredChunkCount = Number(
      storedChunkCountResult.rows[0]?.stored_chunk_count ?? "0",
    );
    if (alreadyStoredChunkCount + request.chunks.length > MAXIMUM_TRANSCRIPT_CHUNKS_PER_SESSION)
      return Promise.reject(new MeetingRepositoryError("TRANSCRIPT_LIMIT_REACHED"));
    let storedChunkCount = 0;
    for (const chunk of request.chunks) {
      const insertResult = await client.query(
        `insert into meeting_transcript_chunks (meeting_id, capture_session_id, sequence_number, captured_at, speaker_display_name, source_language, transcript_text) values ($1,$2,$3,$4,$5,$6,$7) on conflict (capture_session_id, sequence_number) do nothing`,
        [
          meetingId,
          request.captureSessionId,
          chunk.sequenceNumber,
          chunk.capturedAt,
          chunk.speakerDisplayName,
          chunk.sourceLanguage,
          chunk.transcriptText,
        ],
      );
      storedChunkCount += insertResult.rowCount ?? 0;
    }
    const acknowledgementResult = await client.query<{ highest_contiguous: number }>(
      `select min(sequence_candidate) - 1 as highest_contiguous
       from generate_series(
         1,
         (select coalesce(max(sequence_number), 0) + 1 from meeting_transcript_chunks where capture_session_id = $1)
       ) sequence_candidate
       left join meeting_transcript_chunks chunk
         on chunk.capture_session_id = $1 and chunk.sequence_number = sequence_candidate
       where chunk.id is null`,
      [request.captureSessionId],
    );
    const highestContiguousSequenceNumber = Number(
      acknowledgementResult.rows[0]?.highest_contiguous ?? 0,
    );
    await client.query(
      "update meeting_capture_sessions set connection_status = case when $3 = 'capturing' then 'connected' else connection_status end, last_acknowledged_sequence_number = $1 where id = $2",
      [highestContiguousSequenceNumber, request.captureSessionId, authorizedMeeting.status],
    );
    await client.query("commit");
    return { highestContiguousSequenceNumber, storedChunkCount };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function finalizeMeeting(userId: string, meetingId: string): Promise<void> {
  const client = await postgresqlConnectionPool.connect();
  try {
    await client.query("begin");
    const meetingResult = await client.query<{ status: string }>(
      `select meeting.status
       from meetings meeting
       join workspace_members membership on membership.workspace_id = meeting.workspace_id
       where meeting.id = $1 and membership.user_id = $2
       for update`,
      [meetingId, userId],
    );
    const currentMeetingStatus = meetingResult.rows[0]?.status;

    if (currentMeetingStatus === "finalizing") {
      await client.query(
        "insert into meeting_processing_jobs (meeting_id) values ($1) on conflict (meeting_id) do nothing",
        [meetingId],
      );
      await client.query("commit");
      return;
    }
    if (currentMeetingStatus !== "capturing") {
      throw new MeetingRepositoryError("MEETING_NOT_CAPTURING");
    }

    await client.query(
      "update meetings set status = 'finalizing', ended_at = now(), updated_at = now() where id = $1",
      [meetingId],
    );
    await client.query(
      "update meeting_capture_sessions set connection_status = 'ended', ended_at = coalesce(ended_at, now()) where meeting_id = $1",
      [meetingId],
    );
    await client.query(
      "insert into meeting_processing_jobs (meeting_id) values ($1) on conflict (meeting_id) do nothing",
      [meetingId],
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getMeetingTranscript(
  userId: string,
  meetingId: string,
): Promise<
  Array<{
    id: string;
    sequenceNumber: number;
    capturedAt: string;
    speakerDisplayName: string;
    sourceLanguage: string;
    transcriptText: string;
  }>
> {
  const result = await postgresqlConnectionPool.query<{
    id: string;
    sequence_number: number;
    captured_at: Date;
    speaker_display_name: string;
    source_language: string;
    transcript_text: string;
  }>(
    `select chunk.id, chunk.sequence_number, chunk.captured_at, chunk.speaker_display_name, chunk.source_language, chunk.transcript_text from meeting_transcript_chunks chunk join meetings m on m.id = chunk.meeting_id join workspace_members wm on wm.workspace_id = m.workspace_id where chunk.meeting_id = $1 and wm.user_id = $2 order by chunk.sequence_number`,
    [meetingId, userId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    sequenceNumber: row.sequence_number,
    capturedAt: row.captured_at.toISOString(),
    speakerDisplayName: row.speaker_display_name,
    sourceLanguage: row.source_language,
    transcriptText: row.transcript_text,
  }));
}

export class MeetingRepositoryError extends Error {
  constructor(
    public readonly code:
      | "MEETING_NOT_CAPTURING"
      | "TRANSCRIPT_AFTER_MEETING_END"
      | "MEETING_NOT_FOUND"
      | "NOTE_ITEM_NOT_FOUND"
      | "NOTES_NOT_READY"
      | "TRANSCRIPT_LIMIT_REACHED",
  ) {
    super(code);
    this.name = "MeetingRepositoryError";
  }
}

export async function getMeetingDetail(userId: string, meetingId: string) {
  const result = await postgresqlConnectionPool.query<{
    id: string;
    title: string;
    source_platform: string;
    source_language: string;
    status: string;
    started_at: Date;
    ended_at: Date | null;
    capture_session_id: string;
    transcript_chunk_count: string;
    speaker_count: string;
    processing_status: string | null;
    attempt_count: number | null;
    last_error_code: string | null;
  }>(
    `select m.id, m.title, m.source_platform, m.source_language, m.status, m.started_at, m.ended_at,
    cs.id capture_session_id, count(distinct tc.id)::text transcript_chunk_count,
    count(distinct tc.speaker_display_name)::text speaker_count, job.status processing_status,
    job.attempt_count, job.last_error_code from meetings m
    join workspace_members wm on wm.workspace_id=m.workspace_id
    join lateral (select id from meeting_capture_sessions where meeting_id=m.id order by created_at desc limit 1) cs on true
    left join meeting_transcript_chunks tc on tc.meeting_id=m.id
    left join meeting_processing_jobs job on job.meeting_id=m.id
    where m.id=$1 and wm.user_id=$2
    group by m.id, cs.id, job.status, job.attempt_count, job.last_error_code`,
    [meetingId, userId],
  );
  const row = result.rows[0];
  if (!row) throw new MeetingRepositoryError("MEETING_NOT_FOUND");
  return {
    id: row.id,
    title: row.title,
    sourcePlatform: row.source_platform,
    sourceLanguage: row.source_language,
    status: row.status,
    startedAt: row.started_at.toISOString(),
    endedAt: row.ended_at?.toISOString() ?? null,
    captureSessionId: row.capture_session_id,
    transcriptChunkCount: Number(row.transcript_chunk_count),
    speakerCount: Number(row.speaker_count),
    processing: row.processing_status
      ? {
          status: row.processing_status,
          attemptCount: row.attempt_count ?? 0,
          lastErrorCode: row.last_error_code,
        }
      : null,
  };
}

export async function getActionableNotes(userId: string, meetingId: string) {
  const notesResult = await postgresqlConnectionPool.query<{
    id: string;
    summary: string;
    detected_languages: unknown;
    generation_warning: string | null;
    generation_provider: string;
    reviewed_at: Date | null;
  }>(
    `select n.id,n.summary,n.detected_languages,n.generation_warning,n.generation_provider,n.reviewed_at from meeting_actionable_notes n join meetings m on m.id=n.meeting_id join workspace_members wm on wm.workspace_id=m.workspace_id where n.meeting_id=$1 and wm.user_id=$2`,
    [meetingId, userId],
  );
  const notes = notesResult.rows[0];
  if (!notes) throw new MeetingRepositoryError("NOTES_NOT_READY");
  const items = await postgresqlConnectionPool.query<{
    id: string;
    item_type: string;
    content: string;
    owner_display_name: string | null;
    due_date: string | null;
    confidence: string;
    review_status: string;
    evidence_ids: string[];
  }>(
    `select i.id,i.item_type,i.content,i.owner_display_name,i.due_date::text,i.confidence::text,i.review_status,coalesce(array_agg(e.transcript_chunk_id::text) filter(where e.transcript_chunk_id is not null),'{}') evidence_ids from meeting_actionable_note_items i left join meeting_actionable_note_evidence e on e.actionable_note_item_id=i.id where i.actionable_notes_id=$1 group by i.id order by i.display_order`,
    [notes.id],
  );
  return {
    summary: notes.summary,
    detectedLanguages: notes.detected_languages,
    generationWarning: notes.generation_warning,
    generationProvider: notes.generation_provider,
    reviewedAt: notes.reviewed_at?.toISOString() ?? null,
    items: items.rows.map((item) => ({
      id: item.id,
      itemType: item.item_type,
      content: item.content,
      ownerDisplayName: item.owner_display_name,
      dueDate: item.due_date,
      confidence: Number(item.confidence),
      reviewStatus: item.review_status,
      evidenceTranscriptChunkIds: item.evidence_ids,
    })),
  };
}

export async function updateActionableNoteItem(
  userId: string,
  meetingId: string,
  itemId: string,
  request: UpdateActionableNoteItemRequest,
): Promise<void> {
  const result = await postgresqlConnectionPool.query(
    `update meeting_actionable_note_items i set review_status=$4,content=coalesce($5,content),owner_display_name=case when $6::boolean then $7 else owner_display_name end,due_date=case when $8::boolean then $9::date else due_date end,updated_at=now() from meeting_actionable_notes n,meetings m,workspace_members wm where i.id=$1 and n.id=i.actionable_notes_id and m.id=n.meeting_id and m.id=$2 and wm.workspace_id=m.workspace_id and wm.user_id=$3`,
    [
      itemId,
      meetingId,
      userId,
      request.reviewStatus,
      request.content ?? null,
      "ownerDisplayName" in request,
      request.ownerDisplayName ?? null,
      "dueDate" in request,
      request.dueDate ?? null,
    ],
  );
  if (!result.rowCount) throw new MeetingRepositoryError("NOTE_ITEM_NOT_FOUND");
}

export async function markActionableNotesReviewed(
  userId: string,
  meetingId: string,
): Promise<void> {
  const result = await postgresqlConnectionPool.query(
    `with owned as (select m.id from meetings m join workspace_members wm on wm.workspace_id=m.workspace_id where m.id=$1 and wm.user_id=$2), updated as (update meeting_actionable_notes n set reviewed_at=now(),reviewed_by_user_id=$2,updated_at=now() from owned where n.meeting_id=owned.id returning n.meeting_id) update meetings m set status='completed',updated_at=now() from updated where m.id=updated.meeting_id`,
    [meetingId, userId],
  );
  if (!result.rowCount) throw new MeetingRepositoryError("NOTES_NOT_READY");
}

export async function retryMeetingProcessing(userId: string, meetingId: string): Promise<void> {
  const result = await postgresqlConnectionPool.query(
    `update meeting_processing_jobs job set status='queued',attempt_count=0,last_error_code=null,next_attempt_at=now(),locked_at=null,updated_at=now() from meetings m,workspace_members wm where job.meeting_id=m.id and m.id=$1 and wm.workspace_id=m.workspace_id and wm.user_id=$2 and job.status='failed'`,
    [meetingId, userId],
  );
  if (!result.rowCount) throw new MeetingRepositoryError("NOTES_NOT_READY");
  // Tenant scope is repeated rather than relying on the guard above, so this statement is
  // safe to read in isolation and stays safe if the guard is ever refactored away.
  await postgresqlConnectionPool.query(
    `update meetings m set status='finalizing',updated_at=now()
     from workspace_members wm
     where m.id=$1 and wm.workspace_id=m.workspace_id and wm.user_id=$2`,
    [meetingId, userId],
  );
}
