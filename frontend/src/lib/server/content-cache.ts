import { cacheLife, cacheTag } from "next/cache";

import type { ContentDetail, ContentSummary } from "../types";
import { executeBackendRequest } from "./backend-auth";
import { getApiBaseUrl } from "./session";

export const CONTENT_CACHE_TAG = "content";
export const CONTENT_PUBLISHED_CACHE_TAG = "content:published";
export const CONTENT_MANAGEMENT_CACHE_TAG = "content:management";
export const CONTENT_DETAIL_CACHE_TAG_PREFIX = "content:detail";

const CONTENT_CACHE_LIFE = {
  stale: 300,
  revalidate: 900,
  expire: 3600,
};

export async function getCachedContentSummaries(
  accessToken: string,
): Promise<ContentSummary[]> {
  "use cache";
  cacheLife(CONTENT_CACHE_LIFE);
  cacheTag(CONTENT_CACHE_TAG, CONTENT_PUBLISHED_CACHE_TAG);

  return executeBackendRequest<ContentSummary[]>({
    baseUrl: getApiBaseUrl(),
    path: "/api/content",
    tokens: { accessToken },
    skipRefresh: true,
  });
}

export async function getCachedManagedContentSummaries(
  accessToken: string,
): Promise<ContentSummary[]> {
  "use cache";
  cacheLife(CONTENT_CACHE_LIFE);
  cacheTag(CONTENT_CACHE_TAG, CONTENT_MANAGEMENT_CACHE_TAG);

  return executeBackendRequest<ContentSummary[]>({
    baseUrl: getApiBaseUrl(),
    path: "/api/content?includeAll=true",
    tokens: { accessToken },
    skipRefresh: true,
  });
}

export async function getCachedContentDetail(
  accessToken: string,
  id: string,
): Promise<ContentDetail> {
  "use cache";
  cacheLife(CONTENT_CACHE_LIFE);
  cacheTag(CONTENT_CACHE_TAG, `${CONTENT_DETAIL_CACHE_TAG_PREFIX}:${id}`);

  return executeBackendRequest<ContentDetail>({
    baseUrl: getApiBaseUrl(),
    path: `/api/content/${id}`,
    tokens: { accessToken },
    skipRefresh: true,
  });
}
