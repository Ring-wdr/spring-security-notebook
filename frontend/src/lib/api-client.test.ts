import { describe, expect, it, vi } from "vitest";

import { ApiClientError, apiRequest } from "./api-client";

describe("apiRequest", () => {
  it("throws a structured client error with backend code and message", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "ERROR_ACCESS_TOKEN",
            message: "Access token is invalid or expired.",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    await expect(
      apiRequest("/api/content"),
    ).rejects.toMatchObject({
      name: "ApiClientError",
      code: "ERROR_ACCESS_TOKEN",
      displayMessage: "Access token is invalid or expired.",
      status: 401,
    } satisfies Partial<ApiClientError>);

    fetchMock.mockRestore();
  });
});
