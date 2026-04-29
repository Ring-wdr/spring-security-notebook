import { describe, expect, it, vi } from "vitest";

import {
  CONTENT_CACHE_TAG,
  CONTENT_DETAIL_CACHE_TAG_PREFIX,
  CONTENT_MANAGEMENT_CACHE_TAG,
  CONTENT_PUBLISHED_CACHE_TAG,
  getCachedContentDetail,
  getCachedContentSummaries,
  getCachedManagedContentSummaries,
} from "./content-cache";
import { executeBackendRequest } from "./backend-auth";
import { cacheLife, cacheTag } from "next/cache";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("./backend-auth", () => ({
  executeBackendRequest: vi.fn(),
}));

describe("content cache helpers", () => {
  it("tags and fetches the published content feed through a cached scope", async () => {
    vi.mocked(executeBackendRequest).mockResolvedValueOnce([
      { id: 7, title: "JWT basics", category: "SECURITY", published: true },
    ]);

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
    expect(executeBackendRequest).toHaveBeenCalledWith({
      baseUrl: "http://localhost:8080",
      path: "/api/content",
      tokens: { accessToken: "access-token" },
      skipRefresh: true,
    });
  });

  it("separates the manager content feed under its own tag", async () => {
    vi.mocked(executeBackendRequest).mockResolvedValueOnce([]);

    await getCachedManagedContentSummaries("access-token");

    expect(cacheTag).toHaveBeenCalledWith(
      CONTENT_CACHE_TAG,
      CONTENT_MANAGEMENT_CACHE_TAG,
    );
    expect(executeBackendRequest).toHaveBeenCalledWith({
      baseUrl: "http://localhost:8080",
      path: "/api/content?includeAll=true",
      tokens: { accessToken: "access-token" },
      skipRefresh: true,
    });
  });

  it("tags content detail entries by id", async () => {
    vi.mocked(executeBackendRequest).mockResolvedValueOnce({
      id: 42,
      title: "Filter chain",
      category: "SECURITY",
      published: true,
      body: "Details",
    });

    await getCachedContentDetail("access-token", "42");

    expect(cacheTag).toHaveBeenCalledWith(
      CONTENT_CACHE_TAG,
      `${CONTENT_DETAIL_CACHE_TAG_PREFIX}:42`,
    );
    expect(executeBackendRequest).toHaveBeenCalledWith({
      baseUrl: "http://localhost:8080",
      path: "/api/content/42",
      tokens: { accessToken: "access-token" },
      skipRefresh: true,
    });
  });
});
