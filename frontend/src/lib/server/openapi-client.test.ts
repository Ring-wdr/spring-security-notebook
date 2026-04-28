import { describe, expect, it, vi } from "vitest";

import {
  loginWithBackendApi,
  refreshTokensWithBackendApi,
} from "./openapi-client";
import type { TokenPairResponse } from "../types";

const TOKENS: TokenPairResponse = {
  grantType: "Bearer",
  accessToken: "access-token",
  refreshToken: "refresh-token",
  accessTokenExpiresIn: 600,
  refreshTokenExpiresIn: 86400,
};

describe("server OpenAPI client helpers", () => {
  it("uses the generated AuthControllerApi form login request", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(
      Response.json(TOKENS),
    );

    const response = await loginWithBackendApi({
      fetchImpl,
      baseUrl: "http://localhost:8080",
      email: "manager@example.com",
      password: "1111",
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(response).toEqual(TOKENS);
    expect(url).toBe("http://localhost:8080/api/auth/login");
    expect(init).toMatchObject({
      cache: "no-store",
      method: "POST",
    });
    expect(new Headers(init?.headers).get("Content-Type")).toBeNull();
    expect(init?.body).toBeInstanceOf(URLSearchParams);
    expect((init?.body as URLSearchParams).get("email")).toBe(
      "manager@example.com",
    );
    expect((init?.body as URLSearchParams).get("password")).toBe("1111");
  });

  it("uses the generated AuthControllerApi refresh request with bearer auth", async () => {
    const nextTokens: TokenPairResponse = {
      ...TOKENS,
      accessToken: "next-access-token",
      refreshToken: "next-refresh-token",
    };
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(
      Response.json(nextTokens),
    );

    const response = await refreshTokensWithBackendApi({
      fetchImpl,
      baseUrl: "http://localhost:8080",
      tokens: TOKENS,
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(response).toEqual(nextTokens);
    expect(url).toBe("http://localhost:8080/api/auth/refresh");
    expect(init).toMatchObject({
      cache: "no-store",
      method: "POST",
    });
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer access-token",
    );
    expect(new Headers(init?.headers).get("Content-Type")).toBe(
      "application/json",
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      refreshToken: "refresh-token",
    });
  });
});
