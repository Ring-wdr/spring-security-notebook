import "server-only";

import { revalidateTag, updateTag } from "next/cache";

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

export function updateContentAfterMutation(id?: string | number): void {
  updateTag(CONTENT_CACHE_TAG);
  updateTag(CONTENT_PUBLISHED_CACHE_TAG);
  updateTag(CONTENT_MANAGEMENT_CACHE_TAG);

  if (id !== undefined) {
    updateTag(contentDetailCacheTag(id));
  }
}
