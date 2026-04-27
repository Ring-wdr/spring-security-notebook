"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ActiveNavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm transition ${
        active
          ? "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]"
          : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]"
      }`}
    >
      {label}
    </Link>
  );
}
