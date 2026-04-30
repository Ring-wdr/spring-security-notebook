import { Suspense } from "react";

import { GuardPanel } from "@/components/guard-panel";
import { ManageContentClient } from "@/components/manage-content-client";
import {
  getManagedContentDetailForRequest,
  getManagedContentSummariesForRequest,
} from "@/lib/server/content/content-dal";

const CONTENT_ID_PATTERN = /^[1-9]\d*$/;

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
  const selectedContentId = parseSelectedContentId(rawContentId);

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

function parseSelectedContentId(
  value: string | string[] | undefined,
): string | null {
  const contentId = Array.isArray(value) ? value[0] : value;
  if (!contentId || !CONTENT_ID_PATTERN.test(contentId)) {
    return null;
  }

  const numericContentId = Number(contentId);
  return Number.isSafeInteger(numericContentId) ? contentId : null;
}
