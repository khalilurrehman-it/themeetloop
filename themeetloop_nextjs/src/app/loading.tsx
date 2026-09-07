/**
 * Branded loader rather than a skeleton: a segment traces the MeetLoop loop while a bar
 * sweeps beneath it. Pure CSS, so it paints immediately and stays a server component.
 * Both animations are disabled under `prefers-reduced-motion`.
 */
export default function LoadingPage() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-white px-6"
    >
      <div className="meetloop-mark-breathe grid size-20 place-items-center rounded-3xl bg-neutral-950 shadow-xl">
        <svg viewBox="0 0 36 36" className="size-11" aria-hidden="true">
          <path
            d="M8.25 18c0-3.35 1.92-5.75 4.62-5.75C18.15 12.25 18 23.75 23.13 23.75c2.7 0 4.62-2.4 4.62-5.75s-1.92-5.75-4.62-5.75C17.85 12.25 18 23.75 12.87 23.75 10.17 23.75 8.25 21.35 8.25 18Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-neutral-800"
          />
          <path
            d="M8.25 18c0-3.35 1.92-5.75 4.62-5.75C18.15 12.25 18 23.75 23.13 23.75c2.7 0 4.62-2.4 4.62-5.75s-1.92-5.75-4.62-5.75C17.85 12.25 18 23.75 12.87 23.75 10.17 23.75 8.25 21.35 8.25 18Z"
            fill="none"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="meetloop-loop-trace"
          />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-lg font-semibold tracking-tighter text-neutral-950">MeetLoop</p>
        <p className="text-sm text-neutral-500">Loading your meeting memory…</p>
      </div>

      <div className="h-1 w-48 overflow-hidden rounded-full bg-neutral-200">
        <div className="meetloop-progress-sweep h-full w-1/4 rounded-full bg-neutral-950" />
      </div>
    </div>
  );
}
