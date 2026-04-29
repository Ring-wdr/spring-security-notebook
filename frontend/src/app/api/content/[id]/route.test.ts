import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { revalidateTag } from "next/cache";
import { PUT } from "./route";
import { server } from "@/test/msw/server";

const cookieStore = vi.hoisted(() => ({
  value: "",
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/server/content-cache", () => ({
  CONTENT_CACHE_TAG: "content",
  CONTENT_DETAIL_CACHE_TAG_PREFIX: "content:detail",
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

describe("content detail route cache invalidation", () => {
  beforeEach(() => {
    cookieStore.get.mockImplementation(() => ({ value: cookieStore.value }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    cookieStore.value = "";
  });

  it("marks list and detail caches stale after a successful update", async () => {
    cookieStore.value = JSON.stringify({
      grantType: "Bearer",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      accessTokenExpiresIn: 600,
      refreshTokenExpiresIn: 86400,
    });
    const requests: Array<{ authorization: string | null; body: unknown }> = [];
    server.use(
      http.put("http://localhost:8080/api/content/42", async ({ request }) => {
        requests.push({
          authorization: request.headers.get("Authorization"),
          body: await request.json(),
        });
        return HttpResponse.json({ id: 42, title: "Updated content" });
      }),
    );

    await PUT(
      new Request("http://localhost:3000/api/content/42", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated content" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "42" }) },
    );

    expect(requests).toEqual([
      {
        authorization: "Bearer access-token",
        body: { title: "Updated content" },
      },
    ]);
    expect(revalidateTag).toHaveBeenCalledWith("content", "max");
    expect(revalidateTag).toHaveBeenCalledWith("content:detail:42", "max");
  });

  it("keeps content caches when update fails", async () => {
    cookieStore.value = JSON.stringify({
      grantType: "Bearer",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      accessTokenExpiresIn: 600,
      refreshTokenExpiresIn: 86400,
    });
    server.use(
      http.put("http://localhost:8080/api/content/42", () =>
        HttpResponse.json({ error: "FORBIDDEN" }, { status: 403 }),
      ),
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
