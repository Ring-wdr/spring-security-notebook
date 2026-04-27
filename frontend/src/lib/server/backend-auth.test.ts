import { describe, expect, it, vi } from "vitest";

import { executeBackendRequest } from "./backend-auth";
import type { TokenPairResponse } from "../types";

const TOKENS: TokenPairResponse = {
  grantType: "Bearer",
  accessToken: "access-token",
  refreshToken: "refresh-token",
  accessTokenExpiresIn: 3600,
  refreshTokenExpiresIn: 1209600,
};

describe("executeBackendRequest", () => {
  it("retries the original request with refreshed tokens after a 401", async () => {
    const rotatedTokens: TokenPairResponse = {
      ...TOKENS,
      accessToken: "next-access-token",
      refreshToken: "next-refresh-token",
    };
    const onTokensRotated = vi.fn();
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "EXPIRED_ACCESS_TOKEN" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(rotatedTokens), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 1, title: "Spring Security" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const response = await executeBackendRequest<{ id: number; title: string }[]>({
      fetchImpl,
      baseUrl: "http://localhost:8080",
      path: "/api/content",
      tokens: TOKENS,
      onTokensRotated,
    });

    expect(response).toEqual([{ id: 1, title: "Spring Security" }]);
    expect(onTokensRotated).toHaveBeenCalledWith(rotatedTokens);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const thirdRequest = fetchImpl.mock.calls[2]?.[1];
    expect(new Headers(thirdRequest?.headers).get("Authorization")).toBe(
      "Bearer next-access-token",
    );
  });

  it("calls onUnauthorized when refresh also fails", async () => {
    const onUnauthorized = vi.fn();
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "EXPIRED_ACCESS_TOKEN" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "INVALID_REFRESH_TOKEN" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      );

    await expect(
      executeBackendRequest({
        fetchImpl,
        baseUrl: "http://localhost:8080",
        path: "/api/content",
        tokens: TOKENS,
        onUnauthorized,
      }),
    ).rejects.toMatchObject({
      message: "INVALID_REFRESH_TOKEN",
      status: 401,
    });

    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
