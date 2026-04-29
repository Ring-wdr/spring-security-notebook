import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getContentDetailForRequest,
  getManagedContentSummariesForRequest,
  getPublishedContentSummariesForRequest,
} from "./content-dal";
import {
  unsafeGetCachedManagedContentSummariesAfterAuthorization,
  unsafeGetCachedPublishedContentDetailAfterAuthorization,
  unsafeGetCachedPublishedContentSummariesAfterAuthorization,
} from "./cached-content";
import { fetchProtectedOpenApi, requireSession } from "../session";
import {
  hasContentManagementServiceToken,
  hasContentPublishedServiceToken,
} from "./service-tokens";

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  forbidden: vi.fn(() => {
    throw new Error("forbidden");
  }),
}));

vi.mock("../session", () => ({
  fetchProtectedOpenApi: vi.fn(),
  requireSession: vi.fn(),
}));

vi.mock("./cached-content", () => ({
  unsafeGetCachedManagedContentSummariesAfterAuthorization: vi.fn(),
  unsafeGetCachedPublishedContentDetailAfterAuthorization: vi.fn(),
  unsafeGetCachedPublishedContentSummariesAfterAuthorization: vi.fn(),
}));

vi.mock("./service-tokens", () => ({
  hasContentManagementServiceToken: vi.fn(),
  hasContentPublishedServiceToken: vi.fn(),
}));

const mockedRequireSession = vi.mocked(requireSession);
const mockedFetchProtectedOpenApi = vi.mocked(fetchProtectedOpenApi);
const mockedHasPublishedToken = vi.mocked(hasContentPublishedServiceToken);
const mockedHasManagementToken = vi.mocked(hasContentManagementServiceToken);
const mockedCachedPublishedList = vi.mocked(
  unsafeGetCachedPublishedContentSummariesAfterAuthorization,
);
const mockedCachedPublishedDetail = vi.mocked(
  unsafeGetCachedPublishedContentDetailAfterAuthorization,
);
const mockedCachedManagedList = vi.mocked(
  unsafeGetCachedManagedContentSummariesAfterAuthorization,
);

const managerSession = {
  tokens: {
    grantType: "Bearer",
    accessToken: "access-token",
    refreshToken: "refresh-token",
    accessTokenExpiresIn: 600,
    refreshTokenExpiresIn: 86400,
  },
  user: {
    id: 1,
    email: "manager@example.com",
    nickname: "manager",
    roleNames: ["ROLE_MANAGER"],
  },
};

describe("content DAL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRequireSession.mockResolvedValue(managerSession);
    mockedFetchProtectedOpenApi.mockResolvedValue([]);
    mockedCachedPublishedList.mockResolvedValue([]);
    mockedCachedPublishedDetail.mockResolvedValue({
      id: 7,
      title: "JWT",
      body: "Cache boundary",
      category: "security",
      published: true,
    });
    mockedCachedManagedList.mockResolvedValue([]);
  });

  it("uses the cached published list when the service token is configured", async () => {
    mockedHasPublishedToken.mockReturnValue(true);

    await getPublishedContentSummariesForRequest("/content");

    expect(mockedCachedPublishedList).toHaveBeenCalledOnce();
    expect(mockedFetchProtectedOpenApi).not.toHaveBeenCalled();
  });

  it("falls back to the session-backed published list when the service token is missing", async () => {
    mockedHasPublishedToken.mockReturnValue(false);

    await getPublishedContentSummariesForRequest("/content");

    expect(mockedCachedPublishedList).not.toHaveBeenCalled();
    expect(mockedFetchProtectedOpenApi).toHaveBeenCalledOnce();
  });

  it("uses the cached published detail when the service token is configured", async () => {
    mockedHasPublishedToken.mockReturnValue(true);

    await getContentDetailForRequest("7", "/content/7");

    expect(mockedCachedPublishedDetail).toHaveBeenCalledWith("7");
    expect(mockedFetchProtectedOpenApi).not.toHaveBeenCalled();
  });

  it("falls back to the session-backed management list when the management token is missing", async () => {
    mockedHasManagementToken.mockReturnValue(false);

    await getManagedContentSummariesForRequest();

    expect(mockedCachedManagedList).not.toHaveBeenCalled();
    expect(mockedFetchProtectedOpenApi).toHaveBeenCalledOnce();
  });
});
