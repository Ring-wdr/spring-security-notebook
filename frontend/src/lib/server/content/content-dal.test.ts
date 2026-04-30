import { beforeEach, describe, expect, it, vi } from "vitest";

import { forbidden } from "next/navigation";

import {
  getContentDetailForRequest,
  getManagedContentDetailForRequest,
  getManagedContentSummariesForRequest,
  getPublishedContentSummariesForRequest,
} from "./content-dal";
import {
  unsafeGetCachedManagedContentDetailAfterAuthorization,
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
  unsafeGetCachedManagedContentDetailAfterAuthorization: vi.fn(),
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
const mockedForbidden = vi.mocked(forbidden);
const mockedCachedPublishedList = vi.mocked(
  unsafeGetCachedPublishedContentSummariesAfterAuthorization,
);
const mockedCachedPublishedDetail = vi.mocked(
  unsafeGetCachedPublishedContentDetailAfterAuthorization,
);
const mockedCachedManagedList = vi.mocked(
  unsafeGetCachedManagedContentSummariesAfterAuthorization,
);
const mockedCachedManagedDetail = vi.mocked(
  unsafeGetCachedManagedContentDetailAfterAuthorization,
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

const userSession = {
  ...managerSession,
  user: {
    id: 2,
    email: "user@example.com",
    nickname: "user",
    roleNames: ["ROLE_USER"],
  },
};

const noRoleSession = {
  ...managerSession,
  user: {
    id: 3,
    email: "norole@example.com",
    nickname: "norole",
    roleNames: [],
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
    mockedCachedManagedDetail.mockResolvedValue({
      id: 9,
      title: "Draft",
      body: "Manager body",
      category: "security",
      published: false,
    });
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

  it("rejects published content before cached service-token fetch when the session lacks read roles", async () => {
    mockedRequireSession.mockResolvedValue(noRoleSession);
    mockedHasPublishedToken.mockReturnValue(true);

    await expect(
      getPublishedContentSummariesForRequest("/content"),
    ).rejects.toThrow("forbidden");

    expect(mockedForbidden).toHaveBeenCalledOnce();
    expect(mockedCachedPublishedList).not.toHaveBeenCalled();
    expect(mockedFetchProtectedOpenApi).not.toHaveBeenCalled();
  });

  it("uses the cached published detail when the service token is configured", async () => {
    mockedHasPublishedToken.mockReturnValue(true);

    await getContentDetailForRequest("7", "/content/7");

    expect(mockedCachedPublishedDetail).toHaveBeenCalledWith("7");
    expect(mockedFetchProtectedOpenApi).not.toHaveBeenCalled();
  });

  it("rejects published detail before cached service-token fetch when the session lacks read roles", async () => {
    mockedRequireSession.mockResolvedValue(noRoleSession);
    mockedHasPublishedToken.mockReturnValue(true);

    await expect(getContentDetailForRequest("7", "/content/7")).rejects.toThrow(
      "forbidden",
    );

    expect(mockedForbidden).toHaveBeenCalledOnce();
    expect(mockedCachedPublishedDetail).not.toHaveBeenCalled();
    expect(mockedFetchProtectedOpenApi).not.toHaveBeenCalled();
  });

  it("falls back to the session-backed management list when the management token is missing", async () => {
    mockedHasManagementToken.mockReturnValue(false);

    await getManagedContentSummariesForRequest();

    expect(mockedCachedManagedList).not.toHaveBeenCalled();
    expect(mockedFetchProtectedOpenApi).toHaveBeenCalledOnce();
  });

  it("rejects managed content before cached service-token fetch when the session is not a manager", async () => {
    mockedRequireSession.mockResolvedValue(userSession);
    mockedHasManagementToken.mockReturnValue(true);

    await expect(getManagedContentSummariesForRequest()).rejects.toThrow(
      "forbidden",
    );

    expect(mockedForbidden).toHaveBeenCalledOnce();
    expect(mockedCachedManagedList).not.toHaveBeenCalled();
    expect(mockedFetchProtectedOpenApi).not.toHaveBeenCalled();
  });

  it("uses the cached management detail when the management token is configured", async () => {
    mockedHasManagementToken.mockReturnValue(true);
    mockedCachedManagedDetail.mockResolvedValue({
      id: 9,
      title: "Draft",
      body: "Manager body",
      category: "security",
      published: false,
    });

    const detail = await getManagedContentDetailForRequest("9");

    expect(detail.title).toBe("Draft");
    expect(mockedCachedManagedDetail).toHaveBeenCalledWith("9");
    expect(mockedFetchProtectedOpenApi).not.toHaveBeenCalled();
  });

  it("falls back to the session-backed management detail when the management token is missing", async () => {
    mockedHasManagementToken.mockReturnValue(false);
    mockedFetchProtectedOpenApi.mockResolvedValue({
      id: 9,
      title: "Draft",
      body: "Manager body",
      category: "security",
      published: false,
    });

    await getManagedContentDetailForRequest("9");

    const [returnTo, , operation] = mockedFetchProtectedOpenApi.mock.calls[0];
    const getContent = vi.fn();

    await operation({ getContent });

    expect(mockedRequireSession).toHaveBeenCalledWith(
      "/manage/content?contentId=9",
    );
    expect(mockedCachedManagedDetail).not.toHaveBeenCalled();
    expect(mockedFetchProtectedOpenApi).toHaveBeenCalledOnce();
    expect(returnTo).toBe("/manage/content?contentId=9");
    expect(getContent).toHaveBeenCalledWith({
      contentId: 9,
      includeAll: true,
    });
  });

  it("rejects managed detail before cached service-token fetch when the session is not a manager", async () => {
    mockedRequireSession.mockResolvedValue(userSession);
    mockedHasManagementToken.mockReturnValue(true);

    await expect(getManagedContentDetailForRequest("9")).rejects.toThrow(
      "forbidden",
    );

    expect(mockedRequireSession).toHaveBeenCalledWith(
      "/manage/content?contentId=9",
    );
    expect(mockedForbidden).toHaveBeenCalledOnce();
    expect(mockedCachedManagedDetail).not.toHaveBeenCalled();
    expect(mockedFetchProtectedOpenApi).not.toHaveBeenCalled();
  });

  it("rejects invalid management detail ids before session or backend work", async () => {
    await expect(getManagedContentDetailForRequest("abc")).rejects.toThrow(
      "forbidden",
    );

    expect(mockedForbidden).toHaveBeenCalledOnce();
    expect(mockedRequireSession).not.toHaveBeenCalled();
    expect(mockedFetchProtectedOpenApi).not.toHaveBeenCalled();
    expect(mockedCachedManagedDetail).not.toHaveBeenCalled();
  });
});
