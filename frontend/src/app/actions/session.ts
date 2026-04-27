"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { executeBackendRequest } from "@/lib/server/backend-auth";
import { clearSessionCookie, readSessionCookie, writeSessionCookie } from "@/lib/server/session-cookie";
import { getApiBaseUrl } from "@/lib/server/session";
import type { CurrentUser, TokenPairResponse } from "@/lib/types";

export type LoginFormState = {
  error: string | null;
};

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      error: "Email and password are required.",
    };
  }

  const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      email,
      password,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      error: await extractErrorMessage(response),
    };
  }

  let tokens = (await response.json()) as TokenPairResponse;

  try {
    await executeBackendRequest<CurrentUser>({
      baseUrl: getApiBaseUrl(),
      path: "/api/users/me",
      tokens,
      onTokensRotated(rotatedTokens) {
        tokens = rotatedTokens;
      },
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "ERROR_LOGIN",
    };
  }

  writeSessionCookie(await cookies(), tokens);
  redirect("/me");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const tokens = readSessionCookie(cookieStore);

  if (tokens) {
    try {
      await executeBackendRequest<void>({
        baseUrl: getApiBaseUrl(),
        path: "/api/auth/logout",
        init: {
          method: "POST",
        },
        tokens,
        skipRefresh: true,
      });
    } catch {
      // ignore logout failures and clear the cookie anyway
    }
  }

  clearSessionCookie(cookieStore);
  redirect("/login");
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: string;
      message?: string;
    };
    return data.error ?? data.message ?? `HTTP_${response.status}`;
  } catch {
    return `HTTP_${response.status}`;
  }
}
