import type { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DashboardMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
  isLoading: boolean;
  accentClassName?: string;
}

export function DashboardMetricCard({
  icon: MetricIcon,
  label,
  value,
  hint,
  isLoading,
  accentClassName = "bg-neutral-100 text-neutral-600",
}: DashboardMetricCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className={cn("grid size-9 place-items-center rounded-xl", accentClassName)}>
          <MetricIcon aria-hidden="true" className="size-4" />
        </span>
      </div>
      {isLoading ? (
        <Skeleton className="mt-5 h-9 w-14" />
      ) : (
        <p className="mt-5 text-3xl font-semibold tabular-nums tracking-tight text-neutral-950">
          {value}
        </p>
      )}
      <p className="mt-1 text-sm font-medium text-neutral-900">{label}</p>
      <p className="mt-0.5 text-xs leading-5 text-neutral-500">{hint}</p>
    </div>
  );
}
