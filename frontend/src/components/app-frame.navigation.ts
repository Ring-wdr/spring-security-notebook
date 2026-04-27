import type { StoredSession } from "@/lib/types";

export type NavigationItem = {
  href: string;
  label: string;
};

export function getNavigationItems(session: StoredSession | null): NavigationItem[] {
  const roleNames = session?.user?.roleNames ?? [];

  return [
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
  ].filter((item) => item.visible);
}
