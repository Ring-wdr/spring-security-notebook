"use client";

import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from "@/lib/auth-storage";
import type { StoredSession, TokenPairResponse } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type ApiRequestInit = RequestInit & {
  skipRefresh?: boolean;
  skipAuth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  const { skipRefresh = false, skipAuth = false, ...requestInit } = init;
  const session = getStoredSession();
  const headers = new Headers(requestInit.headers);

  if (!skipAuth && session?.tokens.accessToken) {
    headers.set("Authorization", `Bearer ${session.tokens.accessToken}`);
  }

  if (
    requestInit.body &&
    !(requestInit.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    headers,
  });

  if (
    response.status === 401 &&
    !skipRefresh &&
    session?.tokens.refreshToken &&
    session?.tokens.accessToken
  ) {
    const refreshedSession = await refreshSession(session);
    if (refreshedSession) {
      const retryHeaders = new Headers(requestInit.headers);
      retryHeaders.set(
        "Authorization",
        `Bearer ${refreshedSession.tokens.accessToken}`,
      );
      if (
        requestInit.body &&
        !(requestInit.body instanceof FormData) &&
        !retryHeaders.has("Content-Type")
      ) {
        retryHeaders.set("Content-Type", "application/json");
      }

      response = await fetch(`${API_BASE_URL}${path}`, {
        ...requestInit,
        headers: retryHeaders,
      });
    }
  }

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function refreshSession(session: StoredSession): Promise<StoredSession | null> {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.tokens.accessToken}`,
    },
    body: JSON.stringify({ refreshToken: session.tokens.refreshToken }),
  });

  if (!response.ok) {
    clearStoredSession();
    return null;
  }

  const tokens = (await response.json()) as TokenPairResponse;
  const nextSession: StoredSession = {
    ...session,
    tokens,
  };
  setStoredSession(nextSession);
  return nextSession;
}

async function extractError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    return data.error ?? data.message ?? `HTTP_${response.status}`;
  } catch {
    return `HTTP_${response.status}`;
  }
}
