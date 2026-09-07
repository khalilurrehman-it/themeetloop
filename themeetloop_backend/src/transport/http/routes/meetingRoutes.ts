import { fromNodeHeaders } from "better-auth/node";
import express, { type Request, type Response, type Router } from "express";

import { auth } from "../../../modules/authentication/authenticationConfiguration.js";
import {
  createMeeting,
  finalizeMeeting,
  getMeetingTranscript,
  ingestTranscriptBatch,
  listMeetings,
  MeetingRepositoryError,
  getMeetingDetail,
  getActionableNotes,
  updateActionableNoteItem,
  markActionableNotesReviewed,
  retryMeetingProcessing,
} from "../../../modules/meetings/meetingRepository.js";
import {
  createMeetingRequestSchema,
  ingestTranscriptBatchRequestSchema,
  meetingIdentifierSchema,
  actionableNoteItemIdentifierSchema,
  updateActionableNoteItemRequestSchema,
} from "../../../modules/meetings/meetingValidationSchemas.js";

export const meetingRoutes: Router = express.Router();

async function resolveSession(
  request: Request,
  response: Response,
): Promise<{ user: { id: string; name: string } } | null> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
  if (!session) {
    response.status(401).json({
      success: false,
      error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required" },
      meta: { requestId: response.getHeader("X-Request-ID") },
    });
    return null;
  }
  return { user: { id: session.user.id, name: session.user.name } };
}

meetingRoutes.post("/", async (request, response, next) => {
  try {
    const session = await resolveSession(request, response);
    if (!session) return;
    const parsed = createMeetingRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(422).json({
        success: false,
        error: {
          code: "INVALID_MEETING",
          message: "Meeting details are invalid",
          fields: parsed.error.flatten().fieldErrors,
        },
        meta: { requestId: response.getHeader("X-Request-ID") },
      });
      return;
    }
    const meeting = await createMeeting(session.user.id, session.user.name, parsed.data);
    response.status(201).json({
      success: true,
      data: meeting,
      meta: { requestId: response.getHeader("X-Request-ID") },
    });
  } catch (error) {
    next(error);
  }
});
meetingRoutes.get("/", async (request, response, next) => {
  try {
    const session = await resolveSession(request, response);
    if (!session) return;
    response.json({
      success: true,
      data: await listMeetings(session.user.id),
      meta: { requestId: response.getHeader("X-Request-ID") },
    });
  } catch (error) {
    next(error);
  }
});
meetingRoutes.get("/:meetingId", async (request, response, next) => {
  try {
    const session = await resolveSession(request, response);
    if (!session) return;
    const meetingId = meetingIdentifierSchema.safeParse(request.params.meetingId);
    if (!meetingId.success) {
      response.status(422).json({
        success: false,
        error: { code: "INVALID_MEETING_ID", message: "Meeting identifier is invalid" },
        meta: { requestId: response.getHeader("X-Request-ID") },
      });
      return;
    }
    response.json({
      success: true,
      data: await getMeetingDetail(session.user.id, meetingId.data),
      meta: { requestId: response.getHeader("X-Request-ID") },
    });
  } catch (error) {
    if (error instanceof MeetingRepositoryError && error.code === "MEETING_NOT_FOUND") {
      response.status(404).json({
        success: false,
        error: { code: error.code, message: "Meeting was not found" },
        meta: { requestId: response.getHeader("X-Request-ID") },
      });
      return;
    }
    next(error);
  }
});
meetingRoutes.get("/:meetingId/actionable-notes", async (request, response, next) => {
  try {
    const session = await resolveSession(request, response);
    if (!session) return;
    const meetingId = meetingIdentifierSchema.safeParse(request.params.meetingId);
    if (!meetingId.success) {
      response.status(422).json({
        success: false,
        error: { code: "INVALID_MEETING_ID", message: "Meeting identifier is invalid" },
      });
      return;
    }
    response.json({
      success: true,
      data: await getActionableNotes(session.user.id, meetingId.data),
      meta: { requestId: response.getHeader("X-Request-ID") },
    });
  } catch (error) {
    if (error instanceof MeetingRepositoryError && error.code === "NOTES_NOT_READY") {
      response.status(404).json({
        success: false,
        error: { code: error.code, message: "Actionable notes are not ready yet" },
        meta: { requestId: response.getHeader("X-Request-ID") },
      });
      return;
    }
    next(error);
  }
});
meetingRoutes.patch(
  "/:meetingId/actionable-notes/items/:itemId",
  async (request, response, next) => {
    try {
      const session = await resolveSession(request, response);
      if (!session) return;
      const meetingId = meetingIdentifierSchema.safeParse(request.params.meetingId);
      const itemId = actionableNoteItemIdentifierSchema.safeParse(request.params.itemId);
      const body = updateActionableNoteItemRequestSchema.safeParse(request.body);
      if (!meetingId.success || !itemId.success || !body.success) {
        response.status(422).json({
          success: false,
          error: { code: "INVALID_NOTE_UPDATE", message: "Note update is invalid" },
        });
        return;
      }
      await updateActionableNoteItem(session.user.id, meetingId.data, itemId.data, body.data);
      response.json({
        success: true,
        data: { updated: true },
        meta: { requestId: response.getHeader("X-Request-ID") },
      });
    } catch (error) {
      next(error);
    }
  },
);
meetingRoutes.post("/:meetingId/actionable-notes/review", async (request, response, next) => {
  try {
    const session = await resolveSession(request, response);
    if (!session) return;
    const meetingId = meetingIdentifierSchema.safeParse(request.params.meetingId);
    if (!meetingId.success) {
      response.status(422).json({
        success: false,
        error: { code: "INVALID_MEETING_ID", message: "Meeting identifier is invalid" },
      });
      return;
    }
    await markActionableNotesReviewed(session.user.id, meetingId.data);
    response.json({
      success: true,
      data: { status: "completed" },
      meta: { requestId: response.getHeader("X-Request-ID") },
    });
  } catch (error) {
    next(error);
  }
});
meetingRoutes.post("/:meetingId/retry-processing", async (request, response, next) => {
  try {
    const session = await resolveSession(request, response);
    if (!session) return;
    const meetingId = meetingIdentifierSchema.safeParse(request.params.meetingId);
    if (!meetingId.success) {
      response.status(422).json({
        success: false,
        error: { code: "INVALID_MEETING_ID", message: "Meeting identifier is invalid" },
      });
      return;
    }
    await retryMeetingProcessing(session.user.id, meetingId.data);
    response.json({
      success: true,
      data: { status: "queued" },
      meta: { requestId: response.getHeader("X-Request-ID") },
    });
  } catch (error) {
    next(error);
  }
});
meetingRoutes.post("/:meetingId/transcript-batches", async (request, response, next) => {
  try {
    const session = await resolveSession(request, response);
    if (!session) return;
    const meetingId = meetingIdentifierSchema.safeParse(request.params.meetingId);
    const batch = ingestTranscriptBatchRequestSchema.safeParse(request.body);
    if (!meetingId.success || !batch.success) {
      response.status(422).json({
        success: false,
        error: { code: "INVALID_TRANSCRIPT_BATCH", message: "Transcript batch is invalid" },
        meta: { requestId: response.getHeader("X-Request-ID") },
      });
      return;
    }
    response.json({
      success: true,
      data: await ingestTranscriptBatch(session.user.id, meetingId.data, batch.data),
      meta: { requestId: response.getHeader("X-Request-ID") },
    });
  } catch (error) {
    if (error instanceof MeetingRepositoryError) {
      response.status(409).json({
        success: false,
        error: { code: error.code, message: "Meeting is not accepting transcript chunks" },
        meta: { requestId: response.getHeader("X-Request-ID") },
      });
      return;
    }
    next(error);
  }
});
meetingRoutes.post("/:meetingId/finalize", async (request, response, next) => {
  try {
    const session = await resolveSession(request, response);
    if (!session) return;
    const meetingId = meetingIdentifierSchema.safeParse(request.params.meetingId);
    if (!meetingId.success) {
      response.status(422).json({
        success: false,
        error: { code: "INVALID_MEETING_ID", message: "Meeting identifier is invalid" },
        meta: { requestId: response.getHeader("X-Request-ID") },
      });
      return;
    }
    await finalizeMeeting(session.user.id, meetingId.data);
    response.json({
      success: true,
      data: { meetingId: meetingId.data, status: "finalizing" },
      meta: { requestId: response.getHeader("X-Request-ID") },
    });
  } catch (error) {
    if (error instanceof MeetingRepositoryError) {
      response.status(409).json({
        success: false,
        error: { code: error.code, message: "Meeting cannot be finalized" },
        meta: { requestId: response.getHeader("X-Request-ID") },
      });
      return;
    }
    next(error);
  }
});
meetingRoutes.get("/:meetingId/transcript", async (request, response, next) => {
  try {
    const session = await resolveSession(request, response);
    if (!session) return;
    const meetingId = meetingIdentifierSchema.safeParse(request.params.meetingId);
    if (!meetingId.success) {
      response.status(422).json({
        success: false,
        error: { code: "INVALID_MEETING_ID", message: "Meeting identifier is invalid" },
        meta: { requestId: response.getHeader("X-Request-ID") },
      });
      return;
    }
    response.json({
      success: true,
      data: await getMeetingTranscript(session.user.id, meetingId.data),
      meta: { requestId: response.getHeader("X-Request-ID") },
    });
  } catch (error) {
    next(error);
  }
});
