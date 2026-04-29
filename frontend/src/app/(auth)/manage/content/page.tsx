import { Suspense } from "react";

import { GuardPanel } from "@/components/guard-panel";
import { ManageContentClient } from "@/components/manage-content-client";
import { getManagedContentSummariesForRequest } from "@/lib/server/content/content-dal";

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
  const items = await getManagedContentSummariesForRequest();

  return <ManageContentClient initialItems={items} />;
}
