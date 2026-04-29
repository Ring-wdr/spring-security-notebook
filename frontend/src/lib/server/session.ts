import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { BackendOpenApiClients } from "./openapi-client";
import { BackendRequestError, executeOpenApiRequest } from "./openapi-client";
import { readSessionCookie } from "./session-cookie";
import { buildRefreshSessionRedirectPath } from "./refresh-session";
import type { AuthenticatedSession, StoredSession } from "../types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type SessionState =
  | { kind: "anonymous" }
  | { kind: "authenticated"; session: AuthenticatedSession }
  | { kind: "stale" };

const getSessionState = cache(async (): Promise<SessionState> => {
  const cookieStore = await cookies();
  const tokens = readSessionCookie(cookieStore);
  if (!tokens) {
    return { kind: "anonymous" };
  }

  try {
    const user = await executeOpenApiRequest({
      baseUrl: API_BASE_URL,
      tokens,
      createApi: ({ user }) => user,
      operation: (user) => user.getCurrentUser(),
      skipRefresh: true,
    });

    return {
      kind: "authenticated",
      session: {
        tokens,
        user,
      },
    };
  } catch (error) {
    if (error instanceof BackendRequestError && error.status === 401) {
      return { kind: "stale" };
    }
    return { kind: "anonymous" };
  }
});

export const getOptionalSession = cache(async (): Promise<AuthenticatedSession | null> => {
  const sessionState = await getSessionState();
  return sessionState.kind === "authenticated" ? sessionState.session : null;
});

export async function requireSession(returnTo: string): Promise<AuthenticatedSession> {
  const sessionState = await getSessionState();
  if (sessionState.kind === "anonymous") {
    redirect("/login");
  }

  if (sessionState.kind === "stale") {
    redirect(buildRefreshSessionRedirectPath(returnTo));
  }

  return sessionState.session;
}

export async function fetchProtectedOpenApi<TApi, TResult>(
  returnTo: string,
  createApi: (clients: BackendOpenApiClients) => TApi,
  operation: (api: TApi) => Promise<TResult>,
): Promise<TResult> {
  const session = await requireSession(returnTo);

  try {
    return await executeOpenApiRequest({
      baseUrl: API_BASE_URL,
      tokens: session.tokens,
      createApi,
      operation,
      skipRefresh: true,
    });
  } catch (error) {
    if (error instanceof BackendRequestError && error.status === 401) {
      redirect(buildRefreshSessionRedirectPath(returnTo));
    }
    throw error;
  }
}

export function hasAnyRole(session: StoredSession, roles: string[]): boolean {
  return roles.some((role) => session.user?.roleNames.includes(role));
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
