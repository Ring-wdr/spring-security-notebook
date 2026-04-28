import {
  AuthControllerApi,
  Configuration,
  ResponseError,
} from "@/generated/openapi/src";

import { createDisplayError, type DisplayError } from "../auth-errors";
import type { TokenPairResponse } from "../types";

type FetchImpl = typeof fetch;

type BackendApiOptions = {
  fetchImpl?: FetchImpl;
  baseUrl: string;
  accessToken?: string;
};

type LoginWithBackendApiOptions = BackendApiOptions & {
  email: string;
  password: string;
};

type RefreshTokensWithBackendApiOptions = BackendApiOptions & {
  tokens: TokenPairResponse;
};

export async function loginWithBackendApi({
  fetchImpl = fetch,
  baseUrl,
  email,
  password,
}: LoginWithBackendApiOptions): Promise<TokenPairResponse> {
  return createAuthApi({ fetchImpl, baseUrl }).login({
    email,
    password,
  });
}

export async function refreshTokensWithBackendApi({
  fetchImpl = fetch,
  baseUrl,
  tokens,
}: RefreshTokensWithBackendApiOptions): Promise<TokenPairResponse> {
  return createAuthApi({
    fetchImpl,
    baseUrl,
    accessToken: tokens.accessToken,
  }).refresh({
    refreshTokenRequest: {
      refreshToken: tokens.refreshToken,
    },
  });
}

export async function openApiErrorToDisplayError(
  error: unknown,
): Promise<DisplayError> {
  if (error instanceof ResponseError) {
    try {
      const data = (await error.response.json()) as {
        error?: string;
        message?: string;
      };
      return createDisplayError(
        data.error ?? `HTTP_${error.response.status}`,
        data.message,
      );
    } catch {
      return createDisplayError(`HTTP_${error.response.status}`);
    }
  }

  return createDisplayError("ERROR_LOGIN");
}

export function getOpenApiErrorResponse(error: unknown): Response | null {
  return error instanceof ResponseError ? error.response : null;
}

function createAuthApi({
  fetchImpl = fetch,
  baseUrl,
  accessToken,
}: BackendApiOptions): AuthControllerApi {
  return new AuthControllerApi(
    new Configuration({
      basePath: baseUrl,
      accessToken,
      fetchApi(input, init) {
        return fetchImpl(input, {
          ...init,
          cache: "no-store",
        });
      },
    }),
  );
}
