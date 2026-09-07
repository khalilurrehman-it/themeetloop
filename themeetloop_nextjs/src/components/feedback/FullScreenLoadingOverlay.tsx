import { LoaderCircleIcon } from "lucide-react";

interface FullScreenLoadingOverlayProps {
  title: string;
  description: string;
}

export function FullScreenLoadingOverlay({ title, description }: FullScreenLoadingOverlayProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={title}
      className="fixed inset-0 z-[100] grid place-items-center bg-white/90 px-6 backdrop-blur-sm"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="grid size-14 place-items-center rounded-2xl border border-neutral-200 bg-white shadow-lg shadow-neutral-950/10">
          <LoaderCircleIcon aria-hidden="true" className="size-6 animate-spin text-neutral-950" />
        </div>
        <p className="mt-5 text-base font-semibold text-neutral-950">{title}</p>
        <p className="mt-1.5 text-sm leading-6 text-neutral-500">{description}</p>
      </div>
    </div>
  );
}
