import { describe, expect, it, vi } from "vitest";

import { ApiClientError, apiRequest, backendApi } from "./api-client";

describe("apiRequest", () => {
  it("uses generated OpenAPI client methods for typed endpoint requests", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.json([
          {
            id: 1,
            title: "JWT filter chain",
            category: "security",
            published: true,
          },
        ]),
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
    expect(fetchMock).toHaveBeenCalledWith("/api/content?includeAll=true", {
      body: undefined,
      cache: "no-store",
      credentials: undefined,
      headers: {},
      method: "GET",
    });

    fetchMock.mockRestore();
  });

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
      apiRequest(() => backendApi.content.getContents({})),
    ).rejects.toMatchObject({
      name: "ApiClientError",
      code: "ERROR_ACCESS_TOKEN",
      displayMessage: "Access token is invalid or expired.",
      status: 401,
    } satisfies Partial<ApiClientError>);

    fetchMock.mockRestore();
  });
});
