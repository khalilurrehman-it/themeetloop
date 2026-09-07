const DEFAULT_AUTHENTICATION_REDIRECT_PATH = "/dashboard";
const INTERNAL_URL_VALIDATION_ORIGIN = "https://meetloop.local";
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/;

export function resolveSafeAuthenticationRedirectPath(
  requestedRedirect: string | string[] | undefined,
): string {
  if (
    typeof requestedRedirect !== "string" ||
    !requestedRedirect.startsWith("/") ||
    requestedRedirect.startsWith("//") ||
    requestedRedirect.includes("\\") ||
    CONTROL_CHARACTER_PATTERN.test(requestedRedirect)
  ) {
    return DEFAULT_AUTHENTICATION_REDIRECT_PATH;
  }

  try {
    const parsedRedirectUrl = new URL(requestedRedirect, INTERNAL_URL_VALIDATION_ORIGIN);
    if (parsedRedirectUrl.origin !== INTERNAL_URL_VALIDATION_ORIGIN) {
      return DEFAULT_AUTHENTICATION_REDIRECT_PATH;
    }

    return `${parsedRedirectUrl.pathname}${parsedRedirectUrl.search}${parsedRedirectUrl.hash}`;
  } catch {
    return DEFAULT_AUTHENTICATION_REDIRECT_PATH;
  }
}

export function createAuthenticationPageHref(
  authenticationPagePath: "/login" | "/register",
  redirectPath: string,
): string {
  if (redirectPath === DEFAULT_AUTHENTICATION_REDIRECT_PATH) return authenticationPagePath;
  return `${authenticationPagePath}?redirect=${encodeURIComponent(redirectPath)}`;
}
