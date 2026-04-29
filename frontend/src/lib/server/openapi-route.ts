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

type ExecuteRouteOpenApiRequestOptions<TApi, TResult, TBody = undefined> = {
  createApi: (clients: BackendOpenApiClients) => TApi;
  operation: (api: TApi, body: TBody) => Promise<TResult>;
  parseBody?: (request: Request) => Promise<TBody>;
  request?: Request;
};

export async function executeRouteOpenApiRequest<TApi, TResult, TBody = undefined>({
  createApi,
  operation,
  parseBody,
  request,
}: ExecuteRouteOpenApiRequestOptions<TApi, TResult, TBody>): Promise<NextResponse> {
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
    let body: TBody | undefined;
    if (parseBody) {
      if (!request) {
        throw new Error("request is required when parseBody is provided");
      }

      try {
        body = await parseBody(request);
      } catch {
        const displayError = createDisplayError("ERROR_BAD_REQUEST");
        return NextResponse.json(
          { error: displayError.code, message: displayError.message },
          { status: 400 },
        );
      }
    }

    const data = await executeOpenApiRequest({
      baseUrl: getApiBaseUrl(),
      tokens,
      createApi,
      operation: (api) => operation(api, body as TBody),
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
