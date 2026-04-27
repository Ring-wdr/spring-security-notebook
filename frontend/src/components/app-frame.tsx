"use client";

import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { logout, session, status } = useAuth();
  const roleNames = session?.user?.roleNames ?? [];

  const navItems = [
    { href: "/", label: "Overview", visible: true },
    { href: "/login", label: "Login", visible: status !== "authenticated" },
    { href: "/me", label: "My Profile", visible: status === "authenticated" },
    { href: "/content", label: "Contents", visible: status === "authenticated" },
    {
      href: "/manage/content",
      label: "Manage Content",
      visible:
        status === "authenticated" &&
        roleNames.some((role) => role === "ROLE_MANAGER" || role === "ROLE_ADMIN"),
    },
    {
      href: "/manage/users",
      label: "Manage Users",
      visible: status === "authenticated" && roleNames.includes("ROLE_ADMIN"),
    },
  ].filter((item) => item.visible);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(226,153,65,0.22),_transparent_28%),linear-gradient(180deg,_var(--page-top),_var(--page-bottom))] text-[color:var(--foreground)]">
      <header className="border-b border-[color:var(--border)] bg-[color:var(--surface-strong)]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 py-4">
          <div className="space-y-1">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Spring Security Notebook
            </Link>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
              Subscriber Content Hub
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-end gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]"
                      : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {status === "authenticated" ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm text-[color:var(--foreground)] transition hover:bg-[color:var(--surface)]"
              >
                Logout
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10">
        {children}
      </main>
    </div>
  );
}
