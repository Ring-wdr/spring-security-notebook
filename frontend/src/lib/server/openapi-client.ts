import {
  AdminSubscriberControllerApi,
  AuthControllerApi,
  Configuration,
  ContentControllerApi,
  ResponseError,
  UserControllerApi,
} from "@/generated/openapi/src";

import { createDisplayError, type DisplayError } from "../auth-errors";
import type { TokenPairResponse } from "../types";

type FetchImpl = typeof fetch;

type BackendApiOptions = {
  fetchImpl?: FetchImpl;
  baseUrl: string;
  accessToken?: string;
};

export type BackendOpenApiClients = {
  adminSubscribers: AdminSubscriberControllerApi;
  auth: AuthControllerApi;
  content: ContentControllerApi;
  user: UserControllerApi;
};

type LoginWithBackendApiOptions = BackendApiOptions & {
  email: string;
  password: string;
};

type RefreshTokensWithBackendApiOptions = BackendApiOptions & {
  tokens: TokenPairResponse;
};

type ExecuteOpenApiRequestOptions<TApi, TResult> = {
  fetchImpl?: FetchImpl;
  baseUrl: string;
  tokens: Pick<TokenPairResponse, "accessToken"> | TokenPairResponse | null;
  createApi: (clients: BackendOpenApiClients) => TApi;
  operation: (api: TApi) => Promise<TResult>;
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

export async function loginWithBackendApi({
  fetchImpl = fetch,
  baseUrl,
  email,
  password,
}: LoginWithBackendApiOptions): Promise<TokenPairResponse> {
  return createBackendOpenApiClients({ fetchImpl, baseUrl }).auth.login({
    email,
    password,
  });
}

export async function refreshTokensWithBackendApi({
  fetchImpl = fetch,
  baseUrl,
  tokens,
}: RefreshTokensWithBackendApiOptions): Promise<TokenPairResponse> {
  return createBackendOpenApiClients({
    fetchImpl,
    baseUrl,
    accessToken: tokens.accessToken,
  }).auth.refresh({
    refreshTokenRequest: {
      refreshToken: tokens.refreshToken,
    },
  });
}

export async function executeOpenApiRequest<TApi, TResult>({
  fetchImpl = fetch,
  baseUrl,
  tokens,
  createApi,
  operation,
  onTokensRotated,
  onUnauthorized,
  skipRefresh = false,
}: ExecuteOpenApiRequestOptions<TApi, TResult>): Promise<TResult> {
  try {
    return await operation(
      createApi(
        createBackendOpenApiClients({
          fetchImpl,
          baseUrl,
          accessToken: tokens?.accessToken,
        }),
      ),
    );
  } catch (error) {
    const response = getOpenApiErrorResponse(error);
    if (!response) {
      throw error;
    }

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
      return operation(
        createApi(
          createBackendOpenApiClients({
            fetchImpl,
            baseUrl,
            accessToken: refreshResult.tokens.accessToken,
          }),
        ),
      );
    }

    if (response.status === 401) {
      await onUnauthorized?.();
    }
    throw await toBackendRequestError(response);
  }
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

function createBackendOpenApiClients({
  fetchImpl = fetch,
  baseUrl,
  accessToken,
}: BackendApiOptions): BackendOpenApiClients {
  const configuration = new Configuration({
    basePath: baseUrl,
    accessToken,
    fetchApi(input, init) {
      return fetchImpl(input, {
        ...init,
        cache: "no-store",
      });
    },
  });

  return {
    adminSubscribers: new AdminSubscriberControllerApi(configuration),
    auth: new AuthControllerApi(configuration),
    content: new ContentControllerApi(configuration),
    user: new UserControllerApi(configuration),
  };
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
