import "server-only";

export const CONTENT_CACHE_TAG = "content";
export const CONTENT_PUBLISHED_CACHE_TAG = "content:published";
export const CONTENT_MANAGEMENT_CACHE_TAG = "content:management";

export function contentDetailCacheTag(id: string | number): string {
  return `content:detail:${id}`;
}
