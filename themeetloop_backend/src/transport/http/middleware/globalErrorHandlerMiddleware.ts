import type { ErrorRequestHandler } from "express";
import { logApplicationEvent } from "../../../infrastructure/logging/structuredApplicationLogger.js";
import { MeetingRepositoryError } from "../../../modules/meetings/meetingRepository.js";

/**
 * Domain errors are mapped to stable public codes here so that a repository error which a
 * route forgot to handle still reaches the client as its real cause rather than a generic
 * 500. The message is fixed per code and never derived from the error itself.
 */
const MEETING_REPOSITORY_ERROR_RESPONSES: Record<
  MeetingRepositoryError["code"],
  { status: number; message: string }
> = {
  MEETING_NOT_FOUND: { status: 404, message: "Meeting was not found" },
  NOTES_NOT_READY: { status: 409, message: "Actionable notes are not ready for this action" },
  NOTE_ITEM_NOT_FOUND: { status: 404, message: "That outcome was not found" },
  MEETING_NOT_CAPTURING: { status: 409, message: "Meeting is not accepting transcript chunks" },
  TRANSCRIPT_AFTER_MEETING_END: {
    status: 409,
    message: "Transcript chunks were captured after the meeting ended",
  },
  TRANSCRIPT_LIMIT_REACHED: {
    status: 413,
    message: "This capture session has reached its transcript limit. End the meeting to process it",
  },
};

export const globalErrorHandlerMiddleware: ErrorRequestHandler = (
  error,
  request,
  response,
  next,
) => {
  void next;
  const requestId = response.getHeader("X-Request-ID") ?? request.headers["x-request-id"];

  if (error instanceof MeetingRepositoryError) {
    const mappedResponse = MEETING_REPOSITORY_ERROR_RESPONSES[error.code];
    logApplicationEvent("warn", "meeting_domain_error", {
      requestId,
      method: request.method,
      path: request.path,
      errorCode: error.code,
    });
    response.status(mappedResponse.status).json({
      success: false,
      error: { code: error.code, message: mappedResponse.message },
      meta: { requestId },
    });
    return;
  }

  logApplicationEvent(
    "error",
    "unhandled_http_error",
    { requestId, method: request.method, path: request.path },
    error,
  );
  response.status(500).json({
    success: false,
    error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
    meta: { requestId },
  });
};
