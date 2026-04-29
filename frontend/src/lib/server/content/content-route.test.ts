import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BackendOpenApiClients } from "../openapi-client";
import { executeRouteOpenApiRequest } from "../openapi-route";
import {
  createManagedContentResponse,
  getManagedContentDetailResponse,
  getManagedContentSummariesResponse,
  getPublishedContentDetailResponse,
  getPublishedContentSummariesResponse,
  updateManagedContentResponse,
} from "./content-route";

vi.mock("../openapi-route", () => ({
  executeRouteOpenApiRequest: vi.fn(async () => new Response(null)),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

const mockedExecuteRouteOpenApiRequest = vi.mocked(executeRouteOpenApiRequest);

describe("content route helpers", () => {
  beforeEach(() => {
    mockedExecuteRouteOpenApiRequest.mockClear();
  });

  it("keeps published list requests from forwarding includeAll", async () => {
    await getPublishedContentSummariesResponse();
    const options = mockedExecuteRouteOpenApiRequest.mock.calls[0]?.[0];
    const getContents = vi.fn(async () => []);

    await options?.operation(
      { getContents } as unknown as BackendOpenApiClients["content"],
      undefined,
    );

    expect(getContents).toHaveBeenCalledWith({});
  });

  it("keeps published detail requests from forwarding includeAll", async () => {
    await getPublishedContentDetailResponse("7");
    const options = mockedExecuteRouteOpenApiRequest.mock.calls[0]?.[0];
    const getContent = vi.fn(async () => ({
      id: 7,
      title: "JWT basics",
      category: "Security",
      body: "Token boundaries",
      published: true,
    }));

    await options?.operation(
      { getContent } as unknown as BackendOpenApiClients["content"],
      undefined,
    );

    expect(getContent).toHaveBeenCalledWith({ contentId: 7 });
  });

  it("requires manager roles for content creation and updates", async () => {
    const request = new Request("http://localhost:3000/api/content", {
      method: "POST",
      body: "{}",
    });

    await createManagedContentResponse(request);
    await updateManagedContentResponse("7", request);

    expect(
      mockedExecuteRouteOpenApiRequest.mock.calls[0]?.[0].requiredRoles,
    ).toEqual(["ROLE_MANAGER", "ROLE_ADMIN"]);
    expect(
      mockedExecuteRouteOpenApiRequest.mock.calls[1]?.[0].requiredRoles,
    ).toEqual(["ROLE_MANAGER", "ROLE_ADMIN"]);
  });

  it("uses explicit management routes for includeAll reads", async () => {
    await getManagedContentSummariesResponse();
    await getManagedContentDetailResponse("9");

    const listOptions = mockedExecuteRouteOpenApiRequest.mock.calls[0]?.[0];
    const detailOptions = mockedExecuteRouteOpenApiRequest.mock.calls[1]?.[0];
    const getContents = vi.fn(async () => []);
    const getContent = vi.fn(async () => ({
      id: 9,
      title: "Draft",
      category: "Security",
      body: "Draft body",
      published: false,
    }));

    await listOptions?.operation(
      { getContents } as unknown as BackendOpenApiClients["content"],
      undefined,
    );
    await detailOptions?.operation(
      { getContent } as unknown as BackendOpenApiClients["content"],
      undefined,
    );

    expect(listOptions?.requiredRoles).toEqual(["ROLE_MANAGER", "ROLE_ADMIN"]);
    expect(detailOptions?.requiredRoles).toEqual(["ROLE_MANAGER", "ROLE_ADMIN"]);
    expect(getContents).toHaveBeenCalledWith({ includeAll: true });
    expect(getContent).toHaveBeenCalledWith({ contentId: 9, includeAll: true });
  });
});
