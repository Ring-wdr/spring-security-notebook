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

export async function getManagedContentSummariesForRequest(): Promise<
  ContentSummary[]
> {
  const session = await requireSession("/manage/content");

  if (!canManageContent(session)) {
    forbidden();
  }

  if (!hasContentManagementServiceToken()) {
    return fetchProtectedOpenApi(
      "/manage/content",
      ({ content }) => content,
      (content) => content.getContents({ includeAll: true }),
    );
  }

  return unsafeGetCachedManagedContentSummariesAfterAuthorization();
}

export async function getManagedContentDetailForRequest(
  id: string,
): Promise<ContentDetail> {
  const session = await requireSession("/manage/content");

  if (!canManageContent(session)) {
    forbidden();
  }

  if (!hasContentManagementServiceToken()) {
    return fetchProtectedOpenApi(
      `/manage/content?contentId=${id}`,
      ({ content }) => content,
      (content) =>
        content.getContent({
          contentId: Number(id),
          includeAll: true,
        }),
    );
  }

  return unsafeGetCachedManagedContentDetailAfterAuthorization(id);
}
