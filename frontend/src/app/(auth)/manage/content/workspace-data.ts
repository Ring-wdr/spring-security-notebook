import "server-only";

import {
  getManagedContentDetailForRequest,
  getManagedContentSummariesForRequest,
} from "@/lib/server/content/content-dal";
import type { ContentDetail, ContentSummary } from "@/lib/types";

const CONTENT_ID_PATTERN = /^[1-9]\d*$/;

export async function loadManagedContentWorkspaceData(
  searchParams: Awaited<PageProps<"/manage/content">["searchParams"]>,
): Promise<{ items: ContentSummary[]; selectedDetail: ContentDetail | null }> {
  const rawContentId = searchParams.contentId;
  const selectedContentId = parseSelectedContentId(rawContentId);

  const [items, selectedDetail] = await Promise.all([
    getManagedContentSummariesForRequest(),
    selectedContentId ? getSelectedDetailOrNull(selectedContentId) : null,
  ]);

  return { items, selectedDetail };
}

async function getSelectedDetailOrNull(
  contentId: string,
): Promise<ContentDetail | null> {
  try {
    return await getManagedContentDetailForRequest(contentId);
  } catch {
    return null;
  }
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
