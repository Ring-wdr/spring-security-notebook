import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

import { executeRouteOpenApiRequest } from "./openapi-route";
import type { TokenPairResponse } from "../types";
import { server } from "@/test/msw/server";

const cookieStore = vi.hoisted(() => ({
  value: "",
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

const TOKENS: TokenPairResponse = {
  grantType: "Bearer",
  accessToken: "access-token",
  refreshToken: "refresh-token",
  accessTokenExpiresIn: 600,
  refreshTokenExpiresIn: 86400,
};

describe("executeRouteOpenApiRequest", () => {
  it("returns 401 without parsing malformed JSON when the session is missing", async () => {
    cookieStore.value = "";
    cookieStore.get.mockReturnValue(undefined);
    const parseBody = vi.fn(async (request: Request) => request.json());
    const operation = vi.fn();

    const response = await executeRouteOpenApiRequest({
      createApi: (clients) => clients.content,
      parseBody,
      request: new Request("http://localhost:3000/api/content", {
        method: "POST",
        body: "{",
      }),
      operation,
    });

    expect(response.status).toBe(401);
    expect(parseBody).not.toHaveBeenCalled();
    expect(operation).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON after the session is present", async () => {
    cookieStore.value = JSON.stringify(TOKENS);
    cookieStore.get.mockReturnValue({ value: cookieStore.value });
    const operation = vi.fn();

    const response = await executeRouteOpenApiRequest({
      createApi: (clients) => clients.content,
      parseBody: (request) => request.json(),
      request: new Request("http://localhost:3000/api/content", {
        method: "POST",
        body: "{",
      }),
      operation,
    });

    await expect(response.json()).resolves.toEqual({
      error: "ERROR_BAD_REQUEST",
      message: "Request payload is invalid.",
    });
    expect(response.status).toBe(400);
    expect(operation).not.toHaveBeenCalled();
  });

  it("returns 403 when the session lacks a required route role", async () => {
    cookieStore.value = JSON.stringify(TOKENS);
    cookieStore.get.mockReturnValue({ value: cookieStore.value });
    const operation = vi.fn(async () => []);
    server.use(
      http.get("http://localhost:8080/api/users/me", () =>
        HttpResponse.json({
          id: 1,
          email: "user@example.com",
          nickname: "user",
          roleNames: ["ROLE_USER"],
        }),
      ),
    );

    const response = await executeRouteOpenApiRequest({
      createApi: (clients) => clients.content,
      operation,
      requiredRoles: ["ROLE_MANAGER", "ROLE_ADMIN"],
    });

    await expect(response.json()).resolves.toEqual({
      error: "ERROR_ACCESS_DENIED",
      message: "You do not have permission.",
    });
    expect(response.status).toBe(403);
    expect(operation).not.toHaveBeenCalled();
  });

  it("runs the route operation when the session includes a required role", async () => {
    cookieStore.value = JSON.stringify(TOKENS);
    cookieStore.get.mockReturnValue({ value: cookieStore.value });
    const operation = vi.fn(async () => []);
    server.use(
      http.get("http://localhost:8080/api/users/me", () =>
        HttpResponse.json({
          id: 2,
          email: "manager@example.com",
          nickname: "manager",
          roleNames: ["ROLE_MANAGER"],
        }),
      ),
    );

    const response = await executeRouteOpenApiRequest({
      createApi: (clients) => clients.content,
      operation,
      requiredRoles: ["ROLE_MANAGER", "ROLE_ADMIN"],
    });

    await expect(response.json()).resolves.toEqual([]);
    expect(response.status).toBe(200);
    expect(operation).toHaveBeenCalledOnce();
  });
});
