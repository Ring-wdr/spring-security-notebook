import { Suspense } from "react";

import { GuardPanel } from "@/components/guard-panel";
import { ManageContentClient } from "@/components/manage-content-client";
import { fetchProtectedJson, hasAnyRole, requireSession } from "@/lib/server/session";
import type { ContentSummary } from "@/lib/types";

const MANAGER_ROLES = ["ROLE_MANAGER", "ROLE_ADMIN"];

export default function ManageContentPage() {
  return (
    <Suspense
      fallback={
        <GuardPanel
          eyebrow="Manager Surface"
          title="Loading content workspace..."
          body="Preparing the protected content management tools for privileged roles."
        />
      }
    >
      <ManageContentWorkspace />
    </Suspense>
  );
}

async function ManageContentWorkspace() {
  const session = await requireSession();

  if (!hasAnyRole(session, MANAGER_ROLES)) {
    return (
      <GuardPanel
        title="Access restricted"
        body="This page is reserved for manager or admin roles in the practice app."
      />
    );
  }

  const items = await fetchProtectedJson<ContentSummary[]>(
    "/api/content?includeAll=true",
  );

  return <ManageContentClient initialItems={items} />;
}
