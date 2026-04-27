"use client";

import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

type AuthGuardProps = {
  children: ReactNode;
  roles?: string[];
};

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const router = useRouter();
  const { session, status } = useAuth();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "loading") {
    return <GuardMessage title="Loading session..." body="Checking local tokens and refreshing your user state." />;
  }

  if (status === "anonymous" || !session) {
    return <GuardMessage title="Redirecting to login..." body="Protected routes require an authenticated session." />;
  }

  if (
    roles &&
    !roles.some((role) => session.user?.roleNames.includes(role))
  ) {
    return (
      <GuardMessage
        title="Access restricted"
        body="This page is reserved for higher-privilege roles in the practice app."
      >
        <Link href="/me" className="button-secondary">
          Back to profile
        </Link>
      </GuardMessage>
    );
  }

  return <>{children}</>;
}

function GuardMessage({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <section className="panel mx-auto max-w-3xl space-y-4">
      <p className="eyebrow">Protected Route</p>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-[color:var(--muted-foreground)]">{body}</p>
      {children}
    </section>
  );
}
