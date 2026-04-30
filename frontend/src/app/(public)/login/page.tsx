import { redirect } from "next/navigation";

import { LoginLayout } from "@/components/login-layout";
import { getOptionalSession } from "@/lib/server/session";
import { cookies } from "next/headers";
import { readSessionCookie } from "@/lib/server/session-cookie";
import { getLoginGateState } from "./login-gate";

type LoginPageProps = PageProps<"/login">;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, cookieStore, params] = await Promise.all([
    getOptionalSession(),
    cookies(),
    searchParams,
  ]);
  const nextState = getLoginGateState({
    hasSession: Boolean(session),
    hasSessionCookie: Boolean(readSessionCookie(cookieStore)),
    errorParam: params.error,
  });

  if (nextState.type === "redirect") {
    redirect(nextState.location);
  }

  return <LoginLayout initialError={nextState.initialError} />;
}
