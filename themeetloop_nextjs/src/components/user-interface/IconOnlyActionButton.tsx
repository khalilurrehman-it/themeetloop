"use client";

import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface IconOnlyActionButtonProps
  extends Omit<ComponentProps<typeof Button>, "children" | "aria-label"> {
  icon: LucideIcon;
  /**
   * Serves as both the accessible name and the tooltip text, so the visible hint and the
   * name announced to assistive technology can never drift apart.
   */
  label: string;
}

export function IconOnlyActionButton({
  icon: ActionIcon,
  label,
  variant = "ghost",
  size = "icon",
  ...buttonProps
}: IconOnlyActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant={variant} size={size} aria-label={label} {...buttonProps} />}
      >
        <ActionIcon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
