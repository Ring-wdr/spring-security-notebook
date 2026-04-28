import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { logoutAction } from "@/app/actions/session";
import { ActiveNavLink } from "@/components/active-nav-link";
import { getNavigationItems } from "@/components/app-frame.navigation";
import { getOptionalSession } from "@/lib/server/session";
import type { StoredSession } from "@/lib/types";

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(127,192,221,0.18),_transparent_24%),radial-gradient(circle_at_top_left,_rgba(39,95,122,0.12),_transparent_30%),linear-gradient(180deg,_var(--page-top),_var(--page-bottom))] text-[color:var(--foreground)]">
      <header className="border-b border-[color:var(--border)] bg-[color:var(--surface-strong)]/88 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 py-4">
          <div className="space-y-1">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Spring Security Notebook
            </Link>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
              Security Learning Dossier
            </p>
          </div>
          <Suspense fallback={<Navigation session={null} />}>
            <SessionNavigation />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 md:py-12">
        {children}
      </main>
    </div>
  );
}

async function SessionNavigation() {
  const session = await getOptionalSession();
  return <Navigation session={session} />;
}

function Navigation({ session }: { session: StoredSession | null }) {
  const navItems = getNavigationItems(session);

  return (
    <nav className="flex flex-wrap items-center justify-end gap-2">
      {navItems.map((item) => (
        <Suspense
          key={item.href}
          fallback={
            <Link
              href={item.href}
              className="rounded-full border border-transparent px-4 py-2 text-sm text-[color:var(--muted-foreground)] transition hover:border-[color:var(--border)] hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]"
            >
              {item.label}
            </Link>
          }
        >
          <ActiveNavLink href={item.href} label={item.label} />
        </Suspense>
      ))}
      {session ? (
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface)]/72 px-4 py-2 text-sm text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-strong)]"
          >
            Logout
          </button>
        </form>
      ) : null}
    </nav>
  );
}
