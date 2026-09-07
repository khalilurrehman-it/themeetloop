const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const RELATIVE_TIME_THRESHOLDS: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
  { unit: "year", seconds: 60 * 60 * 24 * 365 },
  { unit: "month", seconds: 60 * 60 * 24 * 30 },
  { unit: "week", seconds: 60 * 60 * 24 * 7 },
  { unit: "day", seconds: 60 * 60 * 24 },
  { unit: "hour", seconds: 60 * 60 },
  { unit: "minute", seconds: 60 },
];

export function formatRelativeMeetingTimestamp(isoTimestamp: string): string {
  const timestamp = new Date(isoTimestamp);
  if (Number.isNaN(timestamp.getTime())) return "Unknown time";

  const elapsedSeconds = (timestamp.getTime() - Date.now()) / 1000;
  const absoluteElapsedSeconds = Math.abs(elapsedSeconds);
  if (absoluteElapsedSeconds < 45) return "just now";

  for (const threshold of RELATIVE_TIME_THRESHOLDS) {
    if (absoluteElapsedSeconds >= threshold.seconds) {
      return RELATIVE_TIME_FORMATTER.format(
        Math.round(elapsedSeconds / threshold.seconds),
        threshold.unit,
      );
    }
  }
  return RELATIVE_TIME_FORMATTER.format(Math.round(elapsedSeconds / 60), "minute");
}

export function formatAbsoluteMeetingTimestamp(isoTimestamp: string): string {
  const timestamp = new Date(isoTimestamp);
  if (Number.isNaN(timestamp.getTime())) return "Unknown time";
  return timestamp.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMeetingClockTime(isoTimestamp: string): string {
  const timestamp = new Date(isoTimestamp);
  if (Number.isNaN(timestamp.getTime())) return "--:--";
  return timestamp.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function formatMeetingDuration(startedAt: string, endedAt: string | null): string | null {
  const startTimestamp = new Date(startedAt).getTime();
  const endTimestamp = endedAt ? new Date(endedAt).getTime() : Date.now();
  if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp)) return null;

  const elapsedMinutes = Math.max(0, Math.round((endTimestamp - startTimestamp) / 60000));
  if (elapsedMinutes < 60) return `${elapsedMinutes} min`;
  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}
