import { describe, expect, it, vi } from "vitest";

import { executeRouteOpenApiRequest } from "./openapi-route";
import type { TokenPairResponse } from "../types";

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
});
