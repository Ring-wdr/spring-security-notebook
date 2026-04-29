import { Suspense } from "react";
import { redirect } from "next/navigation";

import { GuardPanel } from "@/components/guard-panel";
import { ManageContentClient } from "@/components/manage-content-client";
import { BackendRequestError } from "@/lib/server/backend-auth";
import { getCachedManagedContentSummaries } from "@/lib/server/content-cache";
import { buildRefreshSessionRedirectPath } from "@/lib/server/refresh-session";
import { hasAnyRole, requireSession } from "@/lib/server/session";
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
  const session = await requireSession("/manage/content");

  if (!hasAnyRole(session, MANAGER_ROLES)) {
    return (
      <GuardPanel
        title="Access restricted"
        body="This page is reserved for manager or admin roles in the practice app."
      />
    );
  }

  let items: ContentSummary[];

  try {
    items = await getCachedManagedContentSummaries(session.tokens.accessToken);
  } catch (error) {
    if (error instanceof BackendRequestError && error.status === 401) {
      redirect(buildRefreshSessionRedirectPath("/manage/content"));
    }
    throw error;
  }

  return <ManageContentClient initialItems={items} />;
}
