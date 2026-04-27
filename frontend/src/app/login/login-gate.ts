import { createDisplayError, getErrorCode } from "@/lib/auth-errors";
import { buildRefreshSessionRedirectPath } from "@/lib/server/refresh-session";

type LoginGateState =
  | {
      type: "redirect";
      location: string;
    }
  | {
      type: "render";
      initialError: {
        code: string;
        message: string;
      } | null;
    };

export function getLoginGateState({
  hasSession,
  hasSessionCookie,
  errorParam,
}: {
  hasSession: boolean;
  hasSessionCookie: boolean;
  errorParam: string | string[] | undefined;
}): LoginGateState {
  if (hasSession) {
    return {
      type: "redirect",
      location: "/me",
    };
  }

  if (hasSessionCookie) {
    return {
      type: "redirect",
      location: buildRefreshSessionRedirectPath("/me"),
    };
  }

  const errorCode = getErrorCode(errorParam);
  return {
    type: "render",
    initialError: errorCode ? createDisplayError(errorCode) : null,
  };
}
