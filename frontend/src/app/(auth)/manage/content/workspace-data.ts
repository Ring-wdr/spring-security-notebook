import "server-only";

import {
  getManagedContentDetailForRequest,
  getManagedContentSummariesForRequest,
} from "@/lib/server/content/content-dal";
import type { ContentDetail, ContentSummary } from "@/lib/types";
import { unstable_rethrow } from "next/navigation";

const CONTENT_ID_PATTERN = /^[1-9]\d*$/;
const MANAGED_CONTENT_PATH = "/manage/content";

export async function loadManagedContentWorkspaceData(
  searchParams: Awaited<PageProps<"/manage/content">["searchParams"]>,
): Promise<{ items: ContentSummary[]; selectedDetail: ContentDetail | null }> {
  const rawContentId = searchParams.contentId;
  const selectedContentId = parseSelectedContentId(rawContentId);
  const returnTo = buildManagedContentReturnTo(selectedContentId);

  const [items, selectedDetail] = await Promise.all([
    getManagedContentSummariesForRequest(returnTo),
    selectedContentId ? getSelectedDetailOrNull(selectedContentId) : null,
  ]);

  return { items, selectedDetail };
}

async function getSelectedDetailOrNull(
  contentId: string,
): Promise<ContentDetail | null> {
  try {
    return await getManagedContentDetailForRequest(contentId);
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}

function buildManagedContentReturnTo(contentId: string | null): string {
  if (!contentId) {
    return MANAGED_CONTENT_PATH;
  }

  return `${MANAGED_CONTENT_PATH}?${new URLSearchParams({
    contentId,
  }).toString()}`;
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
