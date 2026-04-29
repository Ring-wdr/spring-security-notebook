import type { TokenPairResponse } from "../types";
import { createDisplayError } from "../auth-errors";
import {
  getOpenApiErrorResponse,
  refreshTokensWithBackendApi,
} from "./openapi-client";

type ExecuteBackendRequestOptions = {
  fetchImpl?: typeof fetch;
  baseUrl: string;
  path: string;
  init?: RequestInit;
  tokens: Pick<TokenPairResponse, "accessToken"> | TokenPairResponse | null;
  onTokensRotated?: (tokens: TokenPairResponse) => void | Promise<void>;
  onUnauthorized?: () => void | Promise<void>;
  skipRefresh?: boolean;
};

export class BackendRequestError extends Error {
  code: string;
  displayMessage: string;
  status: number;

  constructor(code: string, displayMessage: string, status: number) {
    super(displayMessage);
    this.name = "BackendRequestError";
    this.code = code;
    this.displayMessage = displayMessage;
    this.status = status;
  }
}

export async function executeBackendRequest<T>({
  fetchImpl = fetch,
  baseUrl,
  path,
  init,
  tokens,
  onTokensRotated,
  onUnauthorized,
  skipRefresh = false,
}: ExecuteBackendRequestOptions): Promise<T> {
  const request = createRequestInit(init, tokens?.accessToken);
  let response = await fetchImpl(`${baseUrl}${path}`, request);

  if (response.status === 401 && tokens && !skipRefresh && canRefresh(tokens)) {
    const refreshResult = await refreshTokens({
      fetchImpl,
      baseUrl,
      tokens,
    });

    if (!refreshResult.ok) {
      await onUnauthorized?.();
      throw refreshResult.error;
    }

    await onTokensRotated?.(refreshResult.tokens);
    response = await fetchImpl(
      `${baseUrl}${path}`,
      createRequestInit(init, refreshResult.tokens.accessToken),
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      await onUnauthorized?.();
    }
    throw await toBackendRequestError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function canRefresh(
  tokens: Pick<TokenPairResponse, "accessToken"> | TokenPairResponse,
): tokens is TokenPairResponse {
  return "refreshToken" in tokens;
}

async function refreshTokens({
  fetchImpl,
  baseUrl,
  tokens,
}: {
  fetchImpl: typeof fetch;
  baseUrl: string;
  tokens: TokenPairResponse;
}): Promise<
  | { ok: true; tokens: TokenPairResponse }
  | { ok: false; error: BackendRequestError }
> {
  try {
    return {
      ok: true,
      tokens: await refreshTokensWithBackendApi({
        fetchImpl,
        baseUrl,
        tokens,
      }),
    };
  } catch (error) {
    const response = getOpenApiErrorResponse(error);
    if (!response) {
      throw error;
    }

    return {
      ok: false,
      error: await toBackendRequestError(response),
    };
  }
}

function createRequestInit(
  init: RequestInit | undefined,
  accessToken?: string,
): RequestInit {
  const headers = new Headers(init?.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return {
    ...init,
    headers,
    cache: "no-store",
  };
}

async function toBackendRequestError(response: Response): Promise<BackendRequestError> {
  try {
    const data = (await response.json()) as {
      error?: string;
      message?: string;
    };
    const displayError = createDisplayError(
      data.error ?? `HTTP_${response.status}`,
      data.message,
    );
    return new BackendRequestError(
      displayError.code,
      displayError.message,
      response.status,
    );
  } catch {
    const displayError = createDisplayError(`HTTP_${response.status}`);
    return new BackendRequestError(
      displayError.code,
      displayError.message,
      response.status,
    );
  }
}
