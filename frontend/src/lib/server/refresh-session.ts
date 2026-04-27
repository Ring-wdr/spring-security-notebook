const REFRESH_SESSION_PATH = "/auth/refresh-session";
const DEFAULT_RETURN_TO = "/me";

export function sanitizeReturnTo(returnTo: string | null | undefined): string {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return DEFAULT_RETURN_TO;
  }

  try {
    const url = new URL(returnTo, "http://localhost");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_RETURN_TO;
  }
}

export function buildRefreshSessionRedirectPath(
  returnTo: string | null | undefined,
): string {
  return `${REFRESH_SESSION_PATH}?returnTo=${encodeURIComponent(
    sanitizeReturnTo(returnTo),
  )}`;
}
