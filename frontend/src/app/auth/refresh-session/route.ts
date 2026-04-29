import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { executeOpenApiRequest } from "../../../lib/server/openapi-client";
import {
  buildRefreshSessionRedirectPath,
  sanitizeReturnTo,
} from "../../../lib/server/refresh-session";
import {
  clearSessionCookie,
  readSessionCookie,
  writeSessionCookie,
} from "../../../lib/server/session-cookie";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export { buildRefreshSessionRedirectPath, sanitizeReturnTo };

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = sanitizeReturnTo(requestUrl.searchParams.get("returnTo"));
  const cookieStore = await cookies();
  const tokens = readSessionCookie(cookieStore);

  if (!tokens) {
    return NextResponse.redirect(new URL("/login", requestUrl));
  }

  let nextTokens = tokens;

  try {
    await executeOpenApiRequest({
      baseUrl: API_BASE_URL,
      tokens,
      createApi: ({ user }) => user,
      operation: (user) => user.getCurrentUser(),
      onTokensRotated(rotatedTokens) {
        nextTokens = rotatedTokens;
      },
    });
  } catch {
    const response = NextResponse.redirect(
      new URL("/login?error=ERROR_ACCESS_TOKEN", requestUrl),
    );
    clearSessionCookie(response.cookies);
    return response;
  }

  const response = NextResponse.redirect(new URL(returnTo, requestUrl));
  if (nextTokens !== tokens) {
    writeSessionCookie(response.cookies, nextTokens);
  }
  return response;
}
