import { AUTOMATIC_GOOGLE_MEET_CAPTURE_ENABLED_STORAGE_KEY } from "@/modules/meetings/constants/automaticCaptureConstants";

/**
 * Automatic capture is on unless the user has explicitly turned it off.
 *
 * The stored value is therefore read as an opt-OUT: only the literal string "false" disables
 * it, so an unset key (a new browser, cleared storage) means enabled. The default lives here
 * alone so the settings screen and the capture coordinator can never disagree about it.
 */
export const AUTOMATIC_CAPTURE_ENABLED_BY_DEFAULT = true;

export function readAutomaticCapturePreference(): boolean {
  try {
    const storedValue = localStorage.getItem(AUTOMATIC_GOOGLE_MEET_CAPTURE_ENABLED_STORAGE_KEY);
    if (storedValue === null) return AUTOMATIC_CAPTURE_ENABLED_BY_DEFAULT;
    return storedValue !== "false";
  } catch {
    // Storage blocked: fall back to the default rather than silently disabling capture.
    return AUTOMATIC_CAPTURE_ENABLED_BY_DEFAULT;
  }
}

export function writeAutomaticCapturePreference(isEnabled: boolean): void {
  localStorage.setItem(AUTOMATIC_GOOGLE_MEET_CAPTURE_ENABLED_STORAGE_KEY, String(isEnabled));
}
