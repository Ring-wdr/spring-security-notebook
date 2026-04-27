import type { TokenPairResponse } from "../types";

const SESSION_COOKIE_NAME = "spring-security-notebook-session";

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

type CookieWriter = {
  set: (
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      maxAge?: number;
      path?: string;
      sameSite?: "lax" | "strict" | "none";
      secure?: boolean;
    },
  ) => void;
  delete: (name: string) => void;
};

export function readSessionCookie(cookieStore: CookieReader): TokenPairResponse | null {
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as TokenPairResponse;
  } catch {
    return null;
  }
}

export function writeSessionCookie(
  cookieStore: CookieWriter,
  tokens: TokenPairResponse,
): void {
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(tokens), {
    httpOnly: true,
    maxAge: tokens.refreshTokenExpiresIn,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSessionCookie(cookieStore: CookieWriter): void {
  cookieStore.delete(SESSION_COOKIE_NAME);
}
