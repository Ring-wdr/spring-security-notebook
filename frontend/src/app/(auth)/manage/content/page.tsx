import { Suspense } from "react";

import { GuardPanel } from "@/components/guard-panel";
import { ManageContentClient } from "@/components/manage-content-client";
import { loadManagedContentWorkspaceData } from "./workspace-data";

export default function ManageContentPage({
  searchParams,
}: PageProps<"/manage/content">) {
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
      <ManageContentWorkspace searchParams={searchParams} />
    </Suspense>
  );
}

async function ManageContentWorkspace({
  searchParams,
}: {
  searchParams: PageProps<"/manage/content">["searchParams"];
}) {
  const resolvedSearchParams = await searchParams;
  const { items, selectedDetail } =
    await loadManagedContentWorkspaceData(resolvedSearchParams);

  return (
    <ManageContentClient initialItems={items} selectedDetail={selectedDetail} />
  );
}
