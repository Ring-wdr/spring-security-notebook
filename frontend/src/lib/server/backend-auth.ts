import type { TokenPairResponse } from "../types";

type ExecuteBackendRequestOptions = {
  fetchImpl?: typeof fetch;
  baseUrl: string;
  path: string;
  init?: RequestInit;
  tokens: TokenPairResponse | null;
  onTokensRotated?: (tokens: TokenPairResponse) => void | Promise<void>;
  onUnauthorized?: () => void | Promise<void>;
  skipRefresh?: boolean;
};

export class BackendRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BackendRequestError";
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

  if (response.status === 401 && tokens && !skipRefresh) {
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
  const response = await fetchImpl(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });

  if (!response.ok) {
    return {
      ok: false,
      error: await toBackendRequestError(response),
    };
  }

  return {
    ok: true,
    tokens: (await response.json()) as TokenPairResponse,
  };
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
    return new BackendRequestError(
      data.error ?? data.message ?? `HTTP_${response.status}`,
      response.status,
    );
  } catch {
    return new BackendRequestError(`HTTP_${response.status}`, response.status);
  }
}
