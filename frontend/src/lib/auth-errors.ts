export type DisplayError = {
  code: string;
  message: string;
};

const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  AUTHENTICATION_REQUIRED: "Authentication is required.",
  ERROR_UNAUTHORIZED: "Authentication is required.",
  ERROR_ACCESS_DENIED: "You do not have permission.",
  ERROR_ACCESS_TOKEN: "Access token is invalid or expired.",
  INVALID_ACCESS_TOKEN: "Access token is invalid or expired.",
  EXPIRED_ACCESS_TOKEN: "Access token is invalid or expired.",
  ERROR_REFRESH_TOKEN: "Refresh token is invalid or expired.",
  INVALID_REFRESH_TOKEN: "Refresh token is invalid or expired.",
  ERROR_LOGIN: "Login failed.",
  ERROR_BAD_REQUEST: "Request payload is invalid.",
};

export function getErrorMessage(code: string): string {
  return DEFAULT_ERROR_MESSAGES[code] ?? code;
}

export function createDisplayError(
  code: string,
  message?: string,
): DisplayError {
  return {
    code,
    message: message?.trim() || getErrorMessage(code),
  };
}

export function getErrorCode(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value) {
    return value;
  }

  if (Array.isArray(value) && value[0]) {
    return value[0];
  }

  return null;
}
