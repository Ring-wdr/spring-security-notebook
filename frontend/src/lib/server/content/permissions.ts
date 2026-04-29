import "server-only";

import type { AuthenticatedSession } from "@/lib/types";

const MANAGER_ROLES = ["ROLE_MANAGER", "ROLE_ADMIN"] as const;

export function canManageContent(session: AuthenticatedSession): boolean {
  return session.user.roleNames.some((role) =>
    MANAGER_ROLES.includes(role as (typeof MANAGER_ROLES)[number]),
  );
}
