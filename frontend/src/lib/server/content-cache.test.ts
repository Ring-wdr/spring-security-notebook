import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

import {
  CONTENT_CACHE_TAG,
  CONTENT_DETAIL_CACHE_TAG_PREFIX,
  CONTENT_MANAGEMENT_CACHE_TAG,
  CONTENT_PUBLISHED_CACHE_TAG,
  getCachedContentDetail,
  getCachedContentSummaries,
  getCachedManagedContentSummaries,
} from "./content-cache";
import { cacheLife, cacheTag } from "next/cache";
import { server } from "@/test/msw/server";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

describe("content cache helpers", () => {
  it("tags and fetches the published content feed through a cached scope", async () => {
    const requests: Array<{ authorization: string | null; includeAll: string | null }> = [];
    server.use(
      http.get("http://localhost:8080/api/content", ({ request }) => {
        const url = new URL(request.url);
        requests.push({
          authorization: request.headers.get("Authorization"),
          includeAll: url.searchParams.get("includeAll"),
        });
        return HttpResponse.json([
          { id: 7, title: "JWT basics", category: "SECURITY", published: true },
        ]);
      }),
    );

    const result = await getCachedContentSummaries("access-token");

    expect(result).toHaveLength(1);
    expect(cacheLife).toHaveBeenCalledWith({
      stale: 300,
      revalidate: 900,
      expire: 3600,
    });
    expect(cacheTag).toHaveBeenCalledWith(
      CONTENT_CACHE_TAG,
      CONTENT_PUBLISHED_CACHE_TAG,
    );
    expect(requests).toEqual([
      {
        authorization: "Bearer access-token",
        includeAll: null,
      },
    ]);
  });

  it("separates the manager content feed under its own tag", async () => {
    const requests: Array<{ authorization: string | null; includeAll: string | null }> = [];
    server.use(
      http.get("http://localhost:8080/api/content", ({ request }) => {
        const url = new URL(request.url);
        requests.push({
          authorization: request.headers.get("Authorization"),
          includeAll: url.searchParams.get("includeAll"),
        });
        return HttpResponse.json([]);
      }),
    );

    await getCachedManagedContentSummaries("access-token");

    expect(cacheTag).toHaveBeenCalledWith(
      CONTENT_CACHE_TAG,
      CONTENT_MANAGEMENT_CACHE_TAG,
    );
    expect(requests).toEqual([
      {
        authorization: "Bearer access-token",
        includeAll: "true",
      },
    ]);
  });

  it("tags content detail entries by id", async () => {
    const authorizations: Array<string | null> = [];
    server.use(
      http.get("http://localhost:8080/api/content/42", ({ request }) => {
        authorizations.push(request.headers.get("Authorization"));
        return HttpResponse.json({
          id: 42,
          title: "Filter chain",
          category: "SECURITY",
          published: true,
          body: "Details",
        });
      }),
    );

    await getCachedContentDetail("access-token", "42");

    expect(cacheTag).toHaveBeenCalledWith(
      CONTENT_CACHE_TAG,
      `${CONTENT_DETAIL_CACHE_TAG_PREFIX}:42`,
    );
    expect(authorizations).toEqual(["Bearer access-token"]);
  });
});
