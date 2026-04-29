import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

import { revalidateTag } from "next/cache";
import { POST } from "./route";
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
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

describe("content route cache invalidation", () => {
  beforeEach(() => {
    cookieStore.get.mockImplementation(() => ({ value: cookieStore.value }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    cookieStore.value = "";
  });

  it("marks content caches stale after a successful create", async () => {
    cookieStore.value = JSON.stringify({
      grantType: "Bearer",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      accessTokenExpiresIn: 600,
      refreshTokenExpiresIn: 86400,
    });
    const requests: Array<{ authorization: string | null; body: unknown }> = [];
    server.use(
      http.post("http://localhost:8080/api/content", async ({ request }) => {
        requests.push({
          authorization: request.headers.get("Authorization"),
          body: await request.json(),
        });
        return HttpResponse.json({ id: 9, title: "New content" });
      }),
    );

    await POST(
      new Request("http://localhost:3000/api/content", {
        method: "POST",
        body: JSON.stringify({ title: "New content" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(requests).toEqual([
      {
        authorization: "Bearer access-token",
        body: { title: "New content" },
      },
    ]);
    expect(revalidateTag).toHaveBeenCalledWith("content", "max");
  });

  it("keeps content caches when create fails", async () => {
    cookieStore.value = JSON.stringify({
      grantType: "Bearer",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      accessTokenExpiresIn: 600,
      refreshTokenExpiresIn: 86400,
    });
    server.use(
      http.post("http://localhost:8080/api/content", () =>
        HttpResponse.json({ error: "FORBIDDEN" }, { status: 403 }),
      ),
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
