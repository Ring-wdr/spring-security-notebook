import { Suspense } from "react";

import { GuardPanel } from "@/components/guard-panel";
import { ManageContentClient } from "@/components/manage-content-client";
import {
  getManagedContentDetailForRequest,
  getManagedContentSummariesForRequest,
} from "@/lib/server/content/content-dal";

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
  const rawContentId = resolvedSearchParams.contentId;
  const selectedContentId = Array.isArray(rawContentId)
    ? rawContentId[0]
    : rawContentId;

  const [items, selectedDetail] = await Promise.all([
    getManagedContentSummariesForRequest(),
    selectedContentId
      ? getManagedContentDetailForRequest(selectedContentId)
      : Promise.resolve(null),
  ]);

  return (
    <ManageContentClient initialItems={items} selectedDetail={selectedDetail} />
  );
}
