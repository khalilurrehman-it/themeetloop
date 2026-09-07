import {
  CircleHelpIcon,
  GavelIcon,
  HandshakeIcon,
  OctagonAlertIcon,
  SquareCheckBigIcon,
  type LucideIcon,
} from "lucide-react";

import type { ActionableNoteItemType } from "@/modules/meetings/types/meeting.types";

export interface ActionableNoteItemPresentation {
  label: string;
  icon: LucideIcon;
  badgeClassName: string;
}

export const ACTIONABLE_NOTE_ITEM_PRESENTATION: Record<
  ActionableNoteItemType,
  ActionableNoteItemPresentation
> = {
  decision: {
    label: "Decision",
    icon: GavelIcon,
    badgeClassName: "border-violet-200 bg-violet-50 text-violet-800",
  },
  action: {
    label: "Action",
    icon: SquareCheckBigIcon,
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-800",
  },
  commitment: {
    label: "Commitment",
    icon: HandshakeIcon,
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  blocker: {
    label: "Blocker",
    icon: OctagonAlertIcon,
    badgeClassName: "border-red-200 bg-red-50 text-red-800",
  },
  question: {
    label: "Open question",
    icon: CircleHelpIcon,
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
  },
};

/**
 * Confidence is model-reported and never authoritative, so the wording stays descriptive
 * rather than implying a verified accuracy figure.
 */
export function describeGenerationConfidence(confidence: number): {
  label: string;
  className: string;
} {
  if (confidence >= 0.8) return { label: "High confidence", className: "text-emerald-700" };
  if (confidence >= 0.5) return { label: "Medium confidence", className: "text-amber-700" };
  return { label: "Low confidence — check the evidence", className: "text-red-700" };
}

export function formatActionableNoteDueDate(dueDate: string | null): string | null {
  if (!dueDate) return null;
  const parsedDueDate = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(parsedDueDate.getTime())) return dueDate;
  return parsedDueDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
