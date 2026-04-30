import { forbidden } from "next/navigation";

import { ManageUsersClient } from "@/components/manage-users-client";
import {
  fetchProtectedOpenApi,
  hasAnyRole,
  requireSession,
} from "@/lib/server/session";

export default async function ManageUsersPage() {
  const session = await requireSession("/manage/users");

  if (!hasAnyRole(session, ["ROLE_ADMIN"])) {
    forbidden();
  }

  const users = await fetchProtectedOpenApi(
    "/manage/users",
    ({ adminSubscribers }) => adminSubscribers,
    (adminSubscribers) => adminSubscribers.getSubscribers(),
  );
  return <ManageUsersClient initialUsers={users} />;
}
