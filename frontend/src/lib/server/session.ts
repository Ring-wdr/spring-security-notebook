import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { BackendRequestError, executeBackendRequest } from "./backend-auth";
import { readSessionCookie } from "./session-cookie";
import type { CurrentUser, StoredSession } from "../types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type AuthenticatedSession = StoredSession & {
  user: CurrentUser;
};

export const getOptionalSession = cache(async (): Promise<AuthenticatedSession | null> => {
  const cookieStore = await cookies();
  const tokens = readSessionCookie(cookieStore);
  if (!tokens) {
    return null;
  }

  let nextTokens = tokens;

  try {
    const user = await executeBackendRequest<CurrentUser>({
      baseUrl: API_BASE_URL,
      path: "/api/users/me",
      tokens,
      onTokensRotated(rotatedTokens) {
        nextTokens = rotatedTokens;
      },
    });

    return {
      tokens: nextTokens,
      user,
    };
  } catch {
    return null;
  }
});

export async function requireSession(): Promise<AuthenticatedSession> {
  const session = await getOptionalSession();
  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function fetchProtectedJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const session = await requireSession();

  try {
    return await executeBackendRequest<T>({
      baseUrl: API_BASE_URL,
      path,
      init,
      tokens: session.tokens,
    });
  } catch (error) {
    if (error instanceof BackendRequestError && error.status === 401) {
      redirect("/login");
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
