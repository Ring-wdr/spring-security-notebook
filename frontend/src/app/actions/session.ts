"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createDisplayError, type DisplayError } from "@/lib/auth-errors";
import { executeBackendRequest } from "@/lib/server/backend-auth";
import { clearSessionCookie, readSessionCookie, writeSessionCookie } from "@/lib/server/session-cookie";
import { getApiBaseUrl } from "@/lib/server/session";
import {
  loginWithBackendApi,
  openApiErrorToDisplayError,
} from "@/lib/server/openapi-client";
import type { CurrentUser, TokenPairResponse } from "@/lib/types";

export type LoginFormState = {
  error: DisplayError | null;
};

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      error: createDisplayError("ERROR_BAD_REQUEST", "Email and password are required."),
    };
  }

  let tokens: TokenPairResponse;

  try {
    tokens = await loginWithBackendApi({
      baseUrl: getApiBaseUrl(),
      email,
      password,
    });
  } catch (error) {
    return {
      error: await openApiErrorToDisplayError(error),
    };
  }

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
      error:
        error instanceof Error && "code" in error && "displayMessage" in error
          ? {
              code: String(error.code),
              message: String(error.displayMessage),
            }
          : createDisplayError("ERROR_LOGIN"),
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
