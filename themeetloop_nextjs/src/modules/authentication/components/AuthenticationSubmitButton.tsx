import { LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AuthenticationSubmitButtonProps {
  defaultLabel: string;
  loadingLabel: string;
  isSubmitting: boolean;
}

export function AuthenticationSubmitButton({
  defaultLabel,
  loadingLabel,
  isSubmitting,
}: AuthenticationSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
      className="h-11 w-full rounded-xl text-sm"
    >
      {isSubmitting && <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin" />}
      <span>{isSubmitting ? loadingLabel : defaultLabel}</span>
    </Button>
  );
}
