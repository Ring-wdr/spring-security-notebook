import "server-only";

import { revalidateTag } from "next/cache";

import {
  CONTENT_CACHE_TAG,
  CONTENT_MANAGEMENT_CACHE_TAG,
  CONTENT_PUBLISHED_CACHE_TAG,
  contentDetailCacheTag,
} from "./cache-tags";

export function revalidateContentAfterMutation(id?: string | number): void {
  revalidateTag(CONTENT_CACHE_TAG, "max");
  revalidateTag(CONTENT_PUBLISHED_CACHE_TAG, "max");
  revalidateTag(CONTENT_MANAGEMENT_CACHE_TAG, "max");

  if (id !== undefined) {
    revalidateTag(contentDetailCacheTag(id), "max");
  }
}
