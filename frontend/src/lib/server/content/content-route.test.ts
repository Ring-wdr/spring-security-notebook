import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BackendOpenApiClients } from "../openapi-client";
import { executeRouteOpenApiRequest } from "../openapi-route";
import * as contentRoute from "./content-route";
import {
  getManagedContentSummariesResponse,
  getPublishedContentSummariesResponse,
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

  it("only exposes content list route helpers", () => {
    expect(Object.keys(contentRoute).sort()).toEqual([
      "getManagedContentSummariesResponse",
      "getPublishedContentSummariesResponse",
    ]);
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

  it("requires manager roles for management list requests and forwards includeAll", async () => {
    await getManagedContentSummariesResponse();
    const options = mockedExecuteRouteOpenApiRequest.mock.calls[0]?.[0];
    const getContents = vi.fn(async () => []);

    await options?.operation(
      { getContents } as unknown as BackendOpenApiClients["content"],
      undefined,
    );

    expect(options?.requiredRoles).toEqual(["ROLE_MANAGER", "ROLE_ADMIN"]);
    expect(getContents).toHaveBeenCalledWith({ includeAll: true });
  });
});
