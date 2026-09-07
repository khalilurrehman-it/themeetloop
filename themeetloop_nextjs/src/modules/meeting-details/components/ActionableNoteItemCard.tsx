"use client";

import { useState } from "react";
import {
  CalendarClockIcon,
  CheckIcon,
  LoaderCircleIcon,
  PencilIcon,
  QuoteIcon,
  Trash2Icon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IconOnlyActionButton } from "@/components/user-interface/IconOnlyActionButton";
import { cn } from "@/lib/utils";
import {
  ACTIONABLE_NOTE_ITEM_PRESENTATION,
  describeGenerationConfidence,
  formatActionableNoteDueDate,
} from "@/modules/meeting-details/constants/actionableNoteItemPresentation";
import type { ActionableNoteItem } from "@/modules/meetings/types/meeting.types";

export interface ActionableNoteItemUpdate {
  reviewStatus: "accepted" | "corrected" | "removed";
  content?: string;
}

interface ActionableNoteItemCardProps {
  item: ActionableNoteItem;
  isSaving: boolean;
  isReviewClosed: boolean;
  /** Transcript chunk ids actually rendered on this page, so evidence links resolve. */
  resolvableEvidenceChunkIds: ReadonlySet<string>;
  onUpdate: (itemId: string, update: ActionableNoteItemUpdate) => Promise<void>;
}

export function ActionableNoteItemCard({
  item,
  isSaving,
  isReviewClosed,
  resolvableEvidenceChunkIds,
  onUpdate,
}: ActionableNoteItemCardProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draftContent, setDraftContent] = useState<string>(item.content);

  const presentation = ACTIONABLE_NOTE_ITEM_PRESENTATION[item.itemType];
  const ItemIcon = presentation.icon;
  const confidence = describeGenerationConfidence(item.confidence);
  const formattedDueDate = formatActionableNoteDueDate(item.dueDate);
  const isReviewed = item.reviewStatus === "accepted" || item.reviewStatus === "corrected";

  return (
    <li
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        isReviewed ? "border-emerald-200 bg-emerald-50/40" : "border-neutral-200 bg-white",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                presentation.badgeClassName,
              )}
            >
              <ItemIcon aria-hidden="true" className="size-3.5" />
              {presentation.label}
            </span>
            {isReviewed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                <CheckIcon aria-hidden="true" className="size-3" />
                {item.reviewStatus === "corrected" ? "Corrected" : "Accepted"}
              </span>
            )}
            <span className={cn("text-xs font-medium", confidence.className)}>
              {confidence.label}
            </span>
          </div>

          {isEditing ? (
            <div className="mt-3">
              <label htmlFor={`note-item-${item.id}`} className="sr-only">
                Corrected wording
              </label>
              <Textarea
                id={`note-item-${item.id}`}
                value={draftContent}
                maxLength={2000}
                rows={3}
                autoFocus
                onChange={(changeEvent) => setDraftContent(changeEvent.target.value)}
                className="w-full rounded-xl border-neutral-300 text-sm"
              />
              <p className="mt-1.5 text-xs text-neutral-500">
                The original wording stays in the meeting history. {draftContent.trim().length}/2000
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="rounded-lg"
                  disabled={
                    !draftContent.trim() || draftContent.trim() === item.content || isSaving
                  }
                  onClick={() => {
                    void onUpdate(item.id, {
                      reviewStatus: "corrected",
                      content: draftContent.trim(),
                    }).then(() => setIsEditing(false));
                  }}
                >
                  {isSaving ? (
                    <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
                  ) : (
                    <CheckIcon aria-hidden="true" />
                  )}
                  Save correction
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg"
                  onClick={() => {
                    setDraftContent(item.content);
                    setIsEditing(false);
                  }}
                >
                  <XIcon aria-hidden="true" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-neutral-800">{item.content}</p>
          )}

          {(item.ownerDisplayName || formattedDueDate) && !isEditing && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
              {item.ownerDisplayName && (
                <span className="inline-flex items-center gap-1.5">
                  <UserRoundIcon aria-hidden="true" className="size-3.5 text-neutral-400" />
                  {item.ownerDisplayName}
                </span>
              )}
              {formattedDueDate && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClockIcon aria-hidden="true" className="size-3.5 text-neutral-400" />
                  Due {formattedDueDate}
                </span>
              )}
            </div>
          )}

          {item.evidenceTranscriptChunkIds.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-400">Evidence:</span>
              {item.evidenceTranscriptChunkIds.map((transcriptChunkId, evidenceIndex) => {
                // An id the transcript on this page does not contain would produce a link
                // that silently goes nowhere, which is worse than saying so plainly.
                if (!resolvableEvidenceChunkIds.has(transcriptChunkId))
                  return (
                    <Tooltip key={transcriptChunkId}>
                      <TooltipTrigger
                        render={
                          <span className="inline-flex cursor-help items-center gap-1 rounded-md border border-dashed border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-400" />
                        }
                      >
                        <QuoteIcon aria-hidden="true" className="size-3" />
                        Quote {evidenceIndex + 1}
                      </TooltipTrigger>
                      <TooltipContent>
                        This quote is not in the transcript loaded on this page
                      </TooltipContent>
                    </Tooltip>
                  );

                return (
                  <a
                    key={transcriptChunkId}
                    href={`#transcript-${transcriptChunkId}`}
                    className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                  >
                    <QuoteIcon aria-hidden="true" className="size-3" />
                    Quote {evidenceIndex + 1}
                    <span className="sr-only">
                      {" "}
                      — jump to the transcript line supporting this{" "}
                      {presentation.label.toLowerCase()}
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {!isReviewClosed && !isEditing && (
          <div className="flex gap-1">
            <IconOnlyActionButton
              icon={CheckIcon}
              label={
                item.reviewStatus === "accepted" ? "Already accepted" : "Accept this outcome"
              }
              disabled={isSaving || item.reviewStatus === "accepted"}
              onClick={() => void onUpdate(item.id, { reviewStatus: "accepted" })}
            />
            <IconOnlyActionButton
              icon={PencilIcon}
              label="Correct the wording"
              disabled={isSaving}
              onClick={() => {
                setDraftContent(item.content);
                setIsEditing(true);
              }}
            />

            <AlertDialog>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <AlertDialogTrigger
                      disabled={isSaving}
                      aria-label="Remove this outcome"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "text-neutral-600 hover:bg-red-50 hover:text-red-700",
                      )}
                    />
                  }
                >
                  <Trash2Icon aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent>Remove this outcome</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove this outcome from the review?</AlertDialogTitle>
                  <AlertDialogDescription>
                    It will no longer appear in this meeting&apos;s outcomes. The original
                    transcript and the item&apos;s history are kept, so this can be audited later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm leading-6 text-neutral-700">
                  {item.content}
                </div>
                <AlertDialogFooter>
                  <AlertDialogClose
                    className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-xl")}
                  >
                    Keep it
                  </AlertDialogClose>
                  <Button
                    disabled={isSaving}
                    className="h-10 rounded-xl bg-red-600 text-white hover:bg-red-700"
                    onClick={() => void onUpdate(item.id, { reviewStatus: "removed" })}
                  >
                    {isSaving && <LoaderCircleIcon aria-hidden="true" className="animate-spin" />}
                    Remove outcome
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </li>
  );
}
