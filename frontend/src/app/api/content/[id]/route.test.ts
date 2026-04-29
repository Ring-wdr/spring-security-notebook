import { afterEach, describe, expect, it, vi } from "vitest";

import { revalidateTag } from "next/cache";
import { PUT } from "./route";
import { proxyJsonRequest } from "@/lib/server/proxy-json";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/server/content-cache", () => ({
  CONTENT_CACHE_TAG: "content",
  CONTENT_DETAIL_CACHE_TAG_PREFIX: "content:detail",
}));

vi.mock("@/lib/server/proxy-json", () => ({
  proxyJsonRequest: vi.fn(),
}));

describe("content detail route cache invalidation", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("marks list and detail caches stale after a successful update", async () => {
    vi.mocked(proxyJsonRequest).mockResolvedValueOnce(Response.json({ id: 42 }));

    await PUT(
      new Request("http://localhost:3000/api/content/42", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated content" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "42" }) },
    );

    expect(revalidateTag).toHaveBeenCalledWith("content", "max");
    expect(revalidateTag).toHaveBeenCalledWith("content:detail:42", "max");
  });

  it("keeps content caches when update fails", async () => {
    vi.mocked(proxyJsonRequest).mockResolvedValueOnce(
      Response.json({ error: "FORBIDDEN" }, { status: 403 }),
    );

    await PUT(
      new Request("http://localhost:3000/api/content/42", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated content" }),
      }),
      { params: Promise.resolve({ id: "42" }) },
    );

    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
