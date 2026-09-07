function toSafeErrorDetails(error: unknown) {
  if (!(error instanceof Error))
    return {
      errorName: "UnknownError",
      errorCode: null,
      errorMessage: "An unknown error occurred",
    };
  const errorCode = "code" in error && typeof error.code === "string" ? error.code : null;
  return { errorName: error.name, errorCode, errorMessage: error.message.slice(0, 500) };
}
export function logApplicationEvent(
  severity: "info" | "warn" | "error",
  event: string,
  context: Record<string, unknown> = {},
  error?: unknown,
): void {
  const serialized = JSON.stringify({
    timestamp: new Date().toISOString(),
    severity,
    event,
    ...context,
    ...(error === undefined ? {} : { error: toSafeErrorDetails(error) }),
  });
  if (severity === "error") console.error(serialized);
  else if (severity === "warn") console.warn(serialized);
  else console.info(serialized);
}
