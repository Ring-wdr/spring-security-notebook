import { beforeEach, describe, expect, it, vi } from "vitest";

import { cacheLife, cacheTag } from "next/cache";

import { executeOpenApiRequest } from "../openapi-client";
import {
  CONTENT_CACHE_TAG,
  CONTENT_MANAGEMENT_CACHE_TAG,
  contentDetailCacheTag,
} from "./cache-tags";
import { unsafeGetCachedManagedContentDetailAfterAuthorization } from "./cached-content";
import { getContentManagementServiceToken } from "./service-tokens";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("../openapi-client", () => ({
  executeOpenApiRequest: vi.fn(),
}));

vi.mock("../session", () => ({
  getApiBaseUrl: vi.fn(() => "http://localhost:8080"),
}));

vi.mock("./service-tokens", () => ({
  getContentManagementServiceToken: vi.fn(() => "management-token"),
  getContentPublishedServiceToken: vi.fn(() => "published-token"),
}));

const CONTENT_CACHE_LIFE = {
  stale: 60,
  revalidate: 300,
  expire: 1800,
};

const mockedCacheLife = vi.mocked(cacheLife);
const mockedCacheTag = vi.mocked(cacheTag);
const mockedExecuteOpenApiRequest = vi.mocked(executeOpenApiRequest);
const mockedGetContentManagementServiceToken = vi.mocked(
  getContentManagementServiceToken,
);

describe("cached content helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedExecuteOpenApiRequest.mockResolvedValue({
      id: 9,
      title: "Draft",
      body: "Manager body",
      category: "security",
      published: false,
    });
  });

  it("loads managed content detail with management cache metadata and service token", async () => {
    await unsafeGetCachedManagedContentDetailAfterAuthorization("9");

    const options = mockedExecuteOpenApiRequest.mock.calls[0]?.[0];
    const getContent = vi.fn();

    await options?.operation({ getContent });

    expect(mockedCacheLife).toHaveBeenCalledWith(CONTENT_CACHE_LIFE);
    expect(mockedCacheTag).toHaveBeenCalledWith(
      CONTENT_CACHE_TAG,
      CONTENT_MANAGEMENT_CACHE_TAG,
      contentDetailCacheTag(9),
    );
    expect(mockedGetContentManagementServiceToken).toHaveBeenCalledOnce();
    expect(options?.tokens).toEqual({ accessToken: "management-token" });
    expect(options?.skipRefresh).toBe(true);
    expect(getContent).toHaveBeenCalledWith({
      contentId: 9,
      includeAll: true,
    });
  });
});
