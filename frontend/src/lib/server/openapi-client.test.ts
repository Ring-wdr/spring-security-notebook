import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import {
  executeOpenApiRequest,
  loginWithBackendApi,
  refreshTokensWithBackendApi,
} from "./openapi-client";
import type { TokenPairResponse } from "../types";
import { server } from "@/test/msw/server";

const TOKENS: TokenPairResponse = {
  grantType: "Bearer",
  accessToken: "access-token",
  refreshToken: "refresh-token",
  accessTokenExpiresIn: 600,
  refreshTokenExpiresIn: 86400,
};

describe("server OpenAPI client helpers", () => {
  it("uses the generated AuthControllerApi form login request", async () => {
    const requests: Array<{ url: URL; body: URLSearchParams }> = [];
    server.use(
      http.post("http://localhost:8080/api/auth/login", async ({ request }) => {
        requests.push({
          url: new URL(request.url),
          body: new URLSearchParams(await request.text()),
        });
        return HttpResponse.json(TOKENS);
      }),
    );

    const response = await loginWithBackendApi({
      baseUrl: "http://localhost:8080",
      email: "manager@example.com",
      password: "1111",
    });

    expect(response).toEqual(TOKENS);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.url.pathname).toBe("/api/auth/login");
    expect(requests[0]?.body.get("email")).toBe("manager@example.com");
    expect(requests[0]?.body.get("password")).toBe("1111");
  });

  it("uses the generated AuthControllerApi refresh request with bearer auth", async () => {
    const nextTokens: TokenPairResponse = {
      ...TOKENS,
      accessToken: "next-access-token",
      refreshToken: "next-refresh-token",
    };
    const requests: Array<{ authorization: string | null; body: unknown }> = [];
    server.use(
      http.post("http://localhost:8080/api/auth/refresh", async ({ request }) => {
        requests.push({
          authorization: request.headers.get("Authorization"),
          body: await request.json(),
        });
        return HttpResponse.json(nextTokens);
      }),
    );

    const response = await refreshTokensWithBackendApi({
      baseUrl: "http://localhost:8080",
      tokens: TOKENS,
    });

    expect(response).toEqual(nextTokens);
    expect(requests).toEqual([
      {
        authorization: "Bearer access-token",
        body: {
          refreshToken: "refresh-token",
        },
      },
    ]);
  });

  it("uses generated API clients for authenticated content requests", async () => {
    const authorizations: Array<string | null> = [];
    server.use(
      http.get("http://localhost:8080/api/content", ({ request }) => {
        authorizations.push(request.headers.get("Authorization"));
        return HttpResponse.json([
          {
            id: 1,
            title: "Spring Security",
            category: "SECURITY",
            published: true,
          },
        ]);
      }),
    );

    const response = await executeOpenApiRequest({
      baseUrl: "http://localhost:8080",
      tokens: TOKENS,
      createApi: ({ content }) => content,
      operation: (content) => content.getContents({ includeAll: false }),
    });

    expect(response).toHaveLength(1);
    expect(authorizations).toEqual(["Bearer access-token"]);
  });

  it("retries generated API operations with refreshed tokens after a 401", async () => {
    const nextTokens: TokenPairResponse = {
      ...TOKENS,
      accessToken: "next-access-token",
      refreshToken: "next-refresh-token",
    };
    const contentAuthorizations: Array<string | null> = [];
    server.use(
      http.get("http://localhost:8080/api/content", ({ request }) => {
        contentAuthorizations.push(request.headers.get("Authorization"));
        if (contentAuthorizations.length === 1) {
          return HttpResponse.json({ error: "ERROR_ACCESS_TOKEN" }, { status: 401 });
        }

        return HttpResponse.json([
          {
            id: 1,
            title: "Spring Security",
            category: "SECURITY",
            published: true,
          },
        ]);
      }),
      http.post("http://localhost:8080/api/auth/refresh", async ({ request }) => {
        expect(request.headers.get("Authorization")).toBe("Bearer access-token");
        expect(await request.json()).toEqual({
          refreshToken: "refresh-token",
        });
        return HttpResponse.json(nextTokens);
      }),
    );
    const onTokensRotated = vi.fn();

    const response = await executeOpenApiRequest({
      baseUrl: "http://localhost:8080",
      tokens: TOKENS,
      createApi: ({ content }) => content,
      operation: (content) => content.getContents({}),
      onTokensRotated,
    });

    expect(response).toHaveLength(1);
    expect(contentAuthorizations).toEqual([
      "Bearer access-token",
      "Bearer next-access-token",
    ]);
    expect(onTokensRotated).toHaveBeenCalledWith(nextTokens);
  });

  it("returns a structured backend error when refresh also fails", async () => {
    server.use(
      http.get("http://localhost:8080/api/content", () =>
        HttpResponse.json({ error: "ERROR_ACCESS_TOKEN" }, { status: 401 }),
      ),
      http.post("http://localhost:8080/api/auth/refresh", () =>
        HttpResponse.json(
          {
            error: "INVALID_REFRESH_TOKEN",
            message: "Refresh token is invalid or expired.",
          },
          { status: 401 },
        ),
      ),
    );
    const onUnauthorized = vi.fn();

    await expect(
      executeOpenApiRequest({
        baseUrl: "http://localhost:8080",
        tokens: TOKENS,
        createApi: ({ content }) => content,
        operation: (content) => content.getContents({}),
        onUnauthorized,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_REFRESH_TOKEN",
      displayMessage: "Refresh token is invalid or expired.",
      status: 401,
    });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("does not attempt refresh when skipRefresh is enabled", async () => {
    server.use(
      http.post("http://localhost:8080/api/auth/logout", () =>
        HttpResponse.json({ error: "ERROR_ACCESS_TOKEN" }, { status: 401 }),
      ),
    );
    const onUnauthorized = vi.fn();

    await expect(
      executeOpenApiRequest({
        baseUrl: "http://localhost:8080",
        tokens: TOKENS,
        createApi: ({ auth }) => auth,
        operation: (auth) => auth.logout(),
        onUnauthorized,
        skipRefresh: true,
      }),
    ).rejects.toMatchObject({
      code: "ERROR_ACCESS_TOKEN",
      status: 401,
    });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
