import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createDisplayError } from "../auth-errors";
import type { TokenPairResponse } from "../types";
import type { BackendOpenApiClients } from "./openapi-client";
import {
  BackendRequestError,
  executeOpenApiRequest,
} from "./openapi-client";
import {
  clearSessionCookie,
  readSessionCookie,
  writeSessionCookie,
} from "./session-cookie";
import { getApiBaseUrl } from "./session";

type ExecuteRouteOpenApiRequestOptions<TApi, TResult> = {
  createApi: (clients: BackendOpenApiClients) => TApi;
  operation: (api: TApi) => Promise<TResult>;
};

export async function executeRouteOpenApiRequest<TApi, TResult>({
  createApi,
  operation,
}: ExecuteRouteOpenApiRequestOptions<TApi, TResult>): Promise<NextResponse> {
  const cookieStore = await cookies();
  const tokens = readSessionCookie(cookieStore);

  if (!tokens) {
    const displayError = createDisplayError("ERROR_UNAUTHORIZED");
    const response = NextResponse.json(
      { error: displayError.code, message: displayError.message },
      { status: 401 },
    );
    clearSessionCookie(response.cookies);
    return response;
  }

  let nextTokens: TokenPairResponse = tokens;
  let shouldClearSession = false;

  try {
    const data = await executeOpenApiRequest({
      baseUrl: getApiBaseUrl(),
      tokens,
      createApi,
      operation,
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
            ? error.code
            : "INTERNAL_SERVER_ERROR",
        message:
          error instanceof BackendRequestError
            ? error.displayMessage
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
