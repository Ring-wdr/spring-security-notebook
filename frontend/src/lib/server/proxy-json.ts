import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { BackendRequestError, executeBackendRequest } from "./backend-auth";
import { clearSessionCookie, readSessionCookie, writeSessionCookie } from "./session-cookie";
import { getApiBaseUrl } from "./session";

export async function proxyJsonRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const tokens = readSessionCookie(cookieStore);

  if (!tokens) {
    const response = NextResponse.json(
      { error: "AUTHENTICATION_REQUIRED" },
      { status: 401 },
    );
    clearSessionCookie(response.cookies);
    return response;
  }

  let nextTokens = tokens;
  let shouldClearSession = false;

  try {
    const data = await executeBackendRequest<T>({
      baseUrl: getApiBaseUrl(),
      path,
      init,
      tokens,
      onTokensRotated(rotatedTokens) {
        nextTokens = rotatedTokens;
      },
      onUnauthorized() {
        shouldClearSession = true;
      },
    });

    const response = NextResponse.json(data);
    if (nextTokens !== tokens) {
      writeSessionCookie(response.cookies, nextTokens);
    }
    if (shouldClearSession) {
      clearSessionCookie(response.cookies);
    }
    return response;
  } catch (error) {
    const response = NextResponse.json(
      {
        error:
          error instanceof BackendRequestError
            ? error.message
            : "INTERNAL_SERVER_ERROR",
      },
      {
        status: error instanceof BackendRequestError ? error.status : 500,
      },
    );

    if (shouldClearSession) {
      clearSessionCookie(response.cookies);
    }

    return response;
  }
}
