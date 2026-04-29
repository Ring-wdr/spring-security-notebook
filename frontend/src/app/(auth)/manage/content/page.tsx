import { Suspense } from "react";

import { GuardPanel } from "@/components/guard-panel";
import { ManageContentClient } from "@/components/manage-content-client";
import {
  fetchProtectedOpenApi,
  hasAnyRole,
  requireSession,
} from "@/lib/server/session";
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

  const items: ContentSummary[] = await fetchProtectedOpenApi(
    "/manage/content",
    ({ content }) => content,
    (content) => content.getContents({ includeAll: true }),
  );

  return <ManageContentClient initialItems={items} />;
}
