import { Skeleton } from "@/components/ui/skeleton";

/**
 * Rendered by Next.js the moment a workspace route is requested, so navigation never leaves
 * a blank region while the page chunk and its data are still arriving. The shape mirrors the
 * common page layout — heading, summary row, primary panel — so content does not jump when
 * it replaces this.
 */
export default function ApplicationSectionLoading() {
  return (
    <div role="status" aria-label="Loading page" className="pb-16">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((summaryCardIndex) => (
          <Skeleton key={summaryCardIndex} className="h-32 rounded-2xl" />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    </div>
  );
}
