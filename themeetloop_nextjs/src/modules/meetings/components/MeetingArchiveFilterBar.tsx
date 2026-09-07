"use client";

import { SearchIcon, XIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MeetingLifecycleStatus } from "@/modules/meetings/types/meeting.types";

export type MeetingArchiveStatusFilter = MeetingLifecycleStatus | "all";

const STATUS_FILTER_OPTIONS: Array<{ value: MeetingArchiveStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "capturing", label: "Capturing" },
  { value: "processing", label: "Processing" },
  { value: "review_required", label: "Review needed" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Needs retry" },
];

interface MeetingArchiveFilterBarProps {
  searchTerm: string;
  onSearchTermChange: (nextSearchTerm: string) => void;
  statusFilter: MeetingArchiveStatusFilter;
  onStatusFilterChange: (nextStatusFilter: MeetingArchiveStatusFilter) => void;
  statusCounts: Record<string, number>;
  totalCount: number;
}

export function MeetingArchiveFilterBar({
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
  totalCount,
}: MeetingArchiveFilterBarProps) {
  return (
    <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <InputGroup className="h-11 max-w-sm rounded-xl border-neutral-300 bg-white">
        <InputGroupAddon align="inline-start">
          <SearchIcon aria-hidden="true" className="text-neutral-400" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={searchTerm}
          maxLength={160}
          aria-label="Search meetings by title"
          placeholder="Search meetings…"
          onChange={(changeEvent) => onSearchTermChange(changeEvent.target.value)}
          className="h-full text-sm"
        />
        {searchTerm.length > 0 && (
          <InputGroupAddon align="inline-end">
            <Tooltip>
              <TooltipTrigger
                render={
                  <InputGroupButton
                    size="icon-sm"
                    aria-label="Clear search"
                    onClick={() => onSearchTermChange("")}
                    className="rounded-lg text-neutral-500"
                  />
                }
              >
                <XIcon aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>Clear search</TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        )}
      </InputGroup>

      <div
        role="group"
        aria-label="Filter meetings by status"
        className="flex flex-wrap items-center gap-1.5"
      >
        {STATUS_FILTER_OPTIONS.map((filterOption) => {
          const optionCount =
            filterOption.value === "all" ? totalCount : (statusCounts[filterOption.value] ?? 0);
          const isSelected = statusFilter === filterOption.value;
          return (
            <button
              key={filterOption.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onStatusFilterChange(filterOption.value)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2",
                isSelected
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-950",
              )}
            >
              {filterOption.label}
              <span className="tabular-nums text-neutral-400">{optionCount}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
