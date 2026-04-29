import { Suspense } from "react";

import { GuardPanel } from "@/components/guard-panel";
import { ManageUsersClient } from "@/components/manage-users-client";
import { fetchProtectedOpenApi, hasAnyRole, requireSession } from "@/lib/server/session";

export default function ManageUsersPage() {
  return (
    <Suspense
      fallback={
        <GuardPanel
          eyebrow="Admin Surface"
          title="Loading admin workspace..."
          body="Preparing the protected subscriber role management screen."
        />
      }
    >
      <ManageUsersWorkspace />
    </Suspense>
  );
}

async function ManageUsersWorkspace() {
  const session = await requireSession("/manage/users");

  if (!hasAnyRole(session, ["ROLE_ADMIN"])) {
    return (
      <GuardPanel
        title="Access restricted"
        body="This page is reserved for admin roles in the practice app."
      />
    );
  }

  const users = await fetchProtectedOpenApi(
    "/manage/users",
    ({ adminSubscribers }) => adminSubscribers,
    (adminSubscribers) => adminSubscribers.getSubscribers(),
  );
  return <ManageUsersClient initialUsers={users} />;
}
