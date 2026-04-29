import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { ApiClientError, apiRequest, backendApi } from "./api-client";
import { server } from "@/test/msw/server";

describe("apiRequest", () => {
  it("uses generated OpenAPI client methods for typed endpoint requests", async () => {
    const requests: URL[] = [];
    server.use(
      http.get("http://localhost:3000/api/content", ({ request }) => {
        requests.push(new URL(request.url));
        return HttpResponse.json([
          {
            id: 1,
            title: "JWT filter chain",
            category: "security",
            published: true,
          },
        ]);
      }),
    );

    const response = await apiRequest(() =>
      backendApi.content.getContents({ includeAll: true }),
    );

    expect(response).toEqual([
      {
        id: 1,
        title: "JWT filter chain",
        category: "security",
        published: true,
      },
    ]);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.pathname).toBe("/api/content");
    expect(requests[0]?.searchParams.get("includeAll")).toBe("true");
  });

  it("uses generated form login requests for the Spring Security login endpoint", async () => {
    const bodies: URLSearchParams[] = [];
    server.use(
      http.post("http://localhost:3000/api/auth/login", async ({ request }) => {
        bodies.push(new URLSearchParams(await request.text()));
        return HttpResponse.json({
          grantType: "Bearer",
          accessToken: "access-token",
          refreshToken: "refresh-token",
          accessTokenExpiresIn: 600,
          refreshTokenExpiresIn: 86400,
        });
      }),
    );

    const response = await apiRequest(() =>
      backendApi.auth.login({
        email: "manager@example.com",
        password: "1111",
      }),
    );

    expect(response.accessToken).toBe("access-token");
    expect(bodies).toHaveLength(1);
    expect(bodies[0]?.get("email")).toBe("manager@example.com");
    expect(bodies[0]?.get("password")).toBe("1111");
  });

  it("throws a structured client error with backend code and message", async () => {
    server.use(
      http.get("http://localhost:3000/api/content", () =>
        HttpResponse.json(
          {
            error: "ERROR_ACCESS_TOKEN",
            message: "Access token is invalid or expired.",
          },
          {
            status: 401,
          },
        ),
      ),
    );

    await expect(
      apiRequest(() => backendApi.content.getContents({})),
    ).rejects.toMatchObject({
      name: "ApiClientError",
      code: "ERROR_ACCESS_TOKEN",
      displayMessage: "Access token is invalid or expired.",
      status: 401,
    } satisfies Partial<ApiClientError>);
  });
});
