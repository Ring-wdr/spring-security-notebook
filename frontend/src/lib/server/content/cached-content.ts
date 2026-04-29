import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { executeOpenApiRequest } from "../openapi-client";
import { getApiBaseUrl } from "../session";
import {
  CONTENT_CACHE_TAG,
  CONTENT_MANAGEMENT_CACHE_TAG,
  CONTENT_PUBLISHED_CACHE_TAG,
  contentDetailCacheTag,
} from "./cache-tags";
import {
  getContentManagementServiceToken,
  getContentPublishedServiceToken,
} from "./service-tokens";
import type { ContentDetail, ContentSummary } from "@/lib/types";

const CONTENT_CACHE_LIFE = {
  stale: 60,
  revalidate: 300,
  expire: 1800,
};

export async function unsafeGetCachedPublishedContentSummariesAfterAuthorization(): Promise<
  ContentSummary[]
> {
  "use cache";

  cacheLife(CONTENT_CACHE_LIFE);
  cacheTag(CONTENT_CACHE_TAG, CONTENT_PUBLISHED_CACHE_TAG);

  return executeOpenApiRequest({
    baseUrl: getApiBaseUrl(),
    tokens: { accessToken: getContentPublishedServiceToken() },
    createApi: ({ content }) => content,
    operation: (content) => content.getContents({}),
    skipRefresh: true,
  });
}

export async function unsafeGetCachedPublishedContentDetailAfterAuthorization(
  id: string,
): Promise<ContentDetail> {
  "use cache";

  const contentId = Number(id);

  cacheLife(CONTENT_CACHE_LIFE);
  cacheTag(
    CONTENT_CACHE_TAG,
    CONTENT_PUBLISHED_CACHE_TAG,
    contentDetailCacheTag(contentId),
  );

  return executeOpenApiRequest({
    baseUrl: getApiBaseUrl(),
    tokens: { accessToken: getContentPublishedServiceToken() },
    createApi: ({ content }) => content,
    operation: (content) =>
      content.getContent({
        contentId,
      }),
    skipRefresh: true,
  });
}

export async function unsafeGetCachedManagedContentSummariesAfterAuthorization(): Promise<
  ContentSummary[]
> {
  "use cache";

  cacheLife(CONTENT_CACHE_LIFE);
  cacheTag(CONTENT_CACHE_TAG, CONTENT_MANAGEMENT_CACHE_TAG);

  return executeOpenApiRequest({
    baseUrl: getApiBaseUrl(),
    tokens: { accessToken: getContentManagementServiceToken() },
    createApi: ({ content }) => content,
    operation: (content) => content.getContents({ includeAll: true }),
    skipRefresh: true,
  });
}

export async function unsafeGetCachedManagedContentDetailAfterAuthorization(
  id: string,
): Promise<ContentDetail> {
  "use cache";

  const contentId = Number(id);

  cacheLife(CONTENT_CACHE_LIFE);
  cacheTag(
    CONTENT_CACHE_TAG,
    CONTENT_MANAGEMENT_CACHE_TAG,
    contentDetailCacheTag(contentId),
  );

  return executeOpenApiRequest({
    baseUrl: getApiBaseUrl(),
    tokens: { accessToken: getContentManagementServiceToken() },
    createApi: ({ content }) => content,
    operation: (content) =>
      content.getContent({
        contentId,
        includeAll: true,
      }),
    skipRefresh: true,
  });
}
