"use client";

import { useRouter } from "nextjs-toploader/app";
import { useState } from "react";
import toast from "react-hot-toast";

import { authenticationClient } from "@/modules/authentication/services/authenticationClient";
import { clearLocalCaptureStorage } from "@/modules/meetings/services/localCaptureStorageService";

export function useLogout(destinationAfterLogout: string) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  async function logout(): Promise<void> {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    toast.dismiss();

    try {
      const { error } = await authenticationClient.signOut();
      if (error) {
        toast.error("MeetLoop could not log you out. Please try again.");
        setIsLoggingOut(false);
        return;
      }

      // Buffered captions are meeting content. They must not outlive the session on a
      // shared device, so they are cleared before the redirect.
      clearLocalCaptureStorage();

      toast.success("You have been logged out.");
      router.replace(destinationAfterLogout);
      router.refresh();
    } catch {
      toast.error("MeetLoop could not reach the authentication service.");
      setIsLoggingOut(false);
    }
  }

  return { isLoggingOut, logout };
}
