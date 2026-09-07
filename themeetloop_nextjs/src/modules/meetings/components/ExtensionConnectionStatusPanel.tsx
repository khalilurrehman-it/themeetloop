"use client";

import {
  CircleAlertIcon,
  CloudOffIcon,
  PlugZapIcon,
  RefreshCwIcon,
  RotateCwIcon,
  WifiIcon,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExtensionConnectionStatus } from "@/modules/meetings/types/meeting.types";

interface ConnectionStatusPresentation {
  label: string;
  description: string;
  icon: LucideIcon;
  containerClassName: string;
  iconClassName: string;
  isRecoverable: boolean;
}

const CONNECTION_STATUS_PRESENTATION: Record<
  ExtensionConnectionStatus,
  ConnectionStatusPresentation
> = {
  waiting: {
    label: "Waiting for the extension",
    description: "Open Google Meet and turn on captions. Nothing is lost while you wait.",
    icon: PlugZapIcon,
    containerClassName: "border-neutral-200 bg-white",
    iconClassName: "bg-neutral-100 text-neutral-600",
    isRecoverable: false,
  },
  connected: {
    label: "Connected",
    description: "Captions are streaming and acknowledged by the server as they arrive.",
    icon: WifiIcon,
    containerClassName: "border-emerald-200 bg-emerald-50",
    iconClassName: "bg-emerald-100 text-emerald-700",
    isRecoverable: false,
  },
  reconnecting: {
    label: "Reconnecting",
    description: "The extension stopped sending captions. Checking whether it comes back.",
    icon: RotateCwIcon,
    containerClassName: "border-amber-200 bg-amber-50",
    iconClassName: "bg-amber-100 text-amber-700",
    isRecoverable: true,
  },
  offline_buffering: {
    label: "Offline — buffering locally",
    description: "MeetLoop cannot reach the server. Captions are held on this device and retried.",
    icon: CloudOffIcon,
    containerClassName: "border-amber-200 bg-amber-50",
    iconClassName: "bg-amber-100 text-amber-700",
    isRecoverable: true,
  },
  failed: {
    label: "Delivery stopped",
    description: "The server rejected the last batch. Your captions are still on this device.",
    icon: CircleAlertIcon,
    containerClassName: "border-red-200 bg-red-50",
    iconClassName: "bg-red-100 text-red-700",
    isRecoverable: true,
  },
};

interface ExtensionConnectionStatusPanelProps {
  connectionStatus: ExtensionConnectionStatus;
  bufferedChunkCount: number;
  deliveryErrorMessage: string;
  isLocalBufferPersisted: boolean;
  onRetryDelivery: () => void;
}

export function ExtensionConnectionStatusPanel({
  connectionStatus,
  bufferedChunkCount,
  deliveryErrorMessage,
  isLocalBufferPersisted,
  onRetryDelivery,
}: ExtensionConnectionStatusPanelProps) {
  const presentation = CONNECTION_STATUS_PRESENTATION[connectionStatus];
  const StatusIcon = presentation.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "mt-6 flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center",
        presentation.containerClassName,
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          presentation.iconClassName,
        )}
      >
        <StatusIcon
          aria-hidden="true"
          className={cn("size-5", connectionStatus === "reconnecting" && "animate-spin")}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-950">{presentation.label}</p>
        <p className="mt-0.5 text-xs leading-5 text-neutral-600">
          {deliveryErrorMessage || presentation.description}
        </p>
        {!isLocalBufferPersisted && (
          <p className="mt-1.5 text-xs font-medium leading-5 text-red-700">
            This device cannot save the caption buffer to storage, so unsent captions would be lost
            if the tab closes. End the meeting soon.
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums text-neutral-950">
            {bufferedChunkCount}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">buffered</p>
        </div>
        {presentation.isRecoverable && (
          <Button
            variant="outline"
            onClick={onRetryDelivery}
            className="h-9 rounded-xl bg-white"
            aria-label="Retry caption delivery now"
          >
            <RefreshCwIcon aria-hidden="true" />
            Retry now
          </Button>
        )}
      </div>
    </div>
  );
}
