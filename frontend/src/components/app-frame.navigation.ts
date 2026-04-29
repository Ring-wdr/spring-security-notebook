import type { Route } from "next";

import type { StoredSession } from "@/lib/types";

export type NavigationItem = {
  href: Route;
  label: string;
};

type NavigationConfigItem = NavigationItem & {
  visible: boolean;
};

export function getNavigationItems(session: StoredSession | null): NavigationItem[] {
  const roleNames = session?.user?.roleNames ?? [];

  const items: NavigationConfigItem[] = [
    { href: "/", label: "Overview", visible: true },
    { href: "/learn", label: "Learn", visible: true },
    { href: "/login", label: "Login", visible: !session },
    { href: "/me", label: "My Profile", visible: Boolean(session) },
    { href: "/content", label: "Contents", visible: Boolean(session) },
    {
      href: "/manage/content",
      label: "Manage Content",
      visible: roleNames.some(
        (role) => role === "ROLE_MANAGER" || role === "ROLE_ADMIN",
      ),
    },
    {
      href: "/manage/users",
      label: "Manage Users",
      visible: roleNames.includes("ROLE_ADMIN"),
    },
  ];

  return items.filter((item) => item.visible);
}
