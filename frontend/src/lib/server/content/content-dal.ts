import "server-only";

import { forbidden } from "next/navigation";

import type { ContentDetail, ContentSummary } from "@/lib/types";

import { fetchProtectedOpenApi, requireSession } from "../session";
import {
  unsafeGetCachedManagedContentDetailAfterAuthorization,
  unsafeGetCachedManagedContentSummariesAfterAuthorization,
  unsafeGetCachedPublishedContentDetailAfterAuthorization,
  unsafeGetCachedPublishedContentSummariesAfterAuthorization,
} from "./cached-content";
import { canManageContent, canViewPublishedContent } from "./permissions";
import {
  hasContentManagementServiceToken,
  hasContentPublishedServiceToken,
} from "./service-tokens";

const CONTENT_ID_PATTERN = /^[1-9]\d*$/;

export async function getPublishedContentSummariesForRequest(
  returnTo: string,
): Promise<ContentSummary[]> {
  const session = await requireSession(returnTo);

  if (!canViewPublishedContent(session)) {
    forbidden();
  }

  if (!hasContentPublishedServiceToken()) {
    return fetchProtectedOpenApi(
      returnTo,
      ({ content }) => content,
      (content) => content.getContents({}),
    );
  }

  return unsafeGetCachedPublishedContentSummariesAfterAuthorization();
}

export async function getContentDetailForRequest(
  id: string,
  returnTo: string,
): Promise<ContentDetail> {
  const session = await requireSession(returnTo);

  if (!canViewPublishedContent(session)) {
    forbidden();
  }

  if (!hasContentPublishedServiceToken()) {
    return fetchProtectedOpenApi(
      returnTo,
      ({ content }) => content,
      (content) =>
        content.getContent({
          contentId: Number(id),
        }),
    );
  }

  return unsafeGetCachedPublishedContentDetailAfterAuthorization(id);
}

export async function getManagedContentSummariesForRequest(
  returnTo = "/manage/content",
): Promise<ContentSummary[]> {
  const session = await requireSession(returnTo);

  if (!canManageContent(session)) {
    forbidden();
  }

  if (!hasContentManagementServiceToken()) {
    return fetchProtectedOpenApi(
      returnTo,
      ({ content }) => content,
      (content) => content.getContents({ includeAll: true }),
    );
  }

  return unsafeGetCachedManagedContentSummariesAfterAuthorization();
}

export async function getManagedContentDetailForRequest(
  id: string,
): Promise<ContentDetail> {
  const contentId = parsePositiveContentId(id);
  if (contentId == null) {
    forbidden();
  }

  const returnTo = `/manage/content?${new URLSearchParams({
    contentId: String(contentId),
  }).toString()}`;
  const session = await requireSession(returnTo);

  if (!canManageContent(session)) {
    forbidden();
  }

  if (!hasContentManagementServiceToken()) {
    return fetchProtectedOpenApi(
      returnTo,
      ({ content }) => content,
      (content) =>
        content.getContent({
          contentId,
          includeAll: true,
        }),
    );
  }

  return unsafeGetCachedManagedContentDetailAfterAuthorization(String(contentId));
}

function parsePositiveContentId(id: string): number | null {
  if (!CONTENT_ID_PATTERN.test(id)) {
    return null;
  }

  const contentId = Number(id);
  return Number.isSafeInteger(contentId) ? contentId : null;
}
