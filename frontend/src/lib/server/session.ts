import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { BackendRequestError, executeBackendRequest } from "./backend-auth";
import { readSessionCookie } from "./session-cookie";
import { buildRefreshSessionRedirectPath } from "./refresh-session";
import type { CurrentUser, StoredSession } from "../types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type AuthenticatedSession = StoredSession & {
  user: CurrentUser;
};

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
    const user = await executeBackendRequest<CurrentUser>({
      baseUrl: API_BASE_URL,
      path: "/api/users/me",
      tokens,
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

export async function fetchProtectedJson<T>(
  path: string,
  returnTo: string,
  init?: RequestInit,
): Promise<T> {
  const session = await requireSession(returnTo);

  try {
    return await executeBackendRequest<T>({
      baseUrl: API_BASE_URL,
      path,
      init,
      tokens: session.tokens,
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
