import { afterEach, describe, expect, it, vi } from "vitest";

import { revalidateTag } from "next/cache";
import { POST } from "./route";
import { proxyJsonRequest } from "@/lib/server/proxy-json";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/server/content-cache", () => ({
  CONTENT_CACHE_TAG: "content",
}));

vi.mock("@/lib/server/proxy-json", () => ({
  proxyJsonRequest: vi.fn(),
}));

describe("content route cache invalidation", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("marks content caches stale after a successful create", async () => {
    vi.mocked(proxyJsonRequest).mockResolvedValueOnce(Response.json({ id: 9 }));

    await POST(
      new Request("http://localhost:3000/api/content", {
        method: "POST",
        body: JSON.stringify({ title: "New content" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(revalidateTag).toHaveBeenCalledWith("content", "max");
  });

  it("keeps content caches when create fails", async () => {
    vi.mocked(proxyJsonRequest).mockResolvedValueOnce(
      Response.json({ error: "FORBIDDEN" }, { status: 403 }),
    );

    await POST(
      new Request("http://localhost:3000/api/content", {
        method: "POST",
        body: JSON.stringify({ title: "New content" }),
      }),
    );

    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
