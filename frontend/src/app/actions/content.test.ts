import { beforeEach, describe, expect, it, vi } from "vitest";

import { forbidden } from "next/navigation";

import { updateContentAfterMutation } from "@/lib/server/content/content-cache-invalidation";
import {
  BackendRequestError,
  executeOpenApiRequest,
} from "@/lib/server/openapi-client";
import { getApiBaseUrl, requireSession } from "@/lib/server/session";

import {
  initialSaveContentFormState,
  saveManagedContentAction,
} from "./content";

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  forbidden: vi.fn(() => {
    throw new Error("forbidden");
  }),
}));

vi.mock("@/lib/server/session", () => ({
  getApiBaseUrl: vi.fn(() => "http://localhost:8080"),
  requireSession: vi.fn(),
}));

vi.mock("@/lib/server/openapi-client", () => {
  class MockBackendRequestError extends Error {
    code: string;
    displayMessage: string;
    status: number;

    constructor(code: string, displayMessage: string, status: number) {
      super(displayMessage);
      this.name = "BackendRequestError";
      this.code = code;
      this.displayMessage = displayMessage;
      this.status = status;
    }
  }

  return {
    BackendRequestError: MockBackendRequestError,
    executeOpenApiRequest: vi.fn(),
  };
});

vi.mock("@/lib/server/content/content-cache-invalidation", () => ({
  updateContentAfterMutation: vi.fn(),
}));

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
    ...managerSession.user,
    roleNames: ["ROLE_USER"],
  },
};

const mockedRequireSession = vi.mocked(requireSession);
const mockedGetApiBaseUrl = vi.mocked(getApiBaseUrl);
const mockedExecuteOpenApiRequest = vi.mocked(executeOpenApiRequest);
const mockedUpdateContentAfterMutation = vi.mocked(updateContentAfterMutation);
const mockedForbidden = vi.mocked(forbidden);

function createContentFormData(values: {
  id?: string;
  title?: string;
  body?: string;
  category?: string;
  published?: string;
}): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      formData.set(key, value);
    }
  }

  return formData;
}

describe("saveManagedContentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRequireSession.mockResolvedValue(managerSession);
    mockedExecuteOpenApiRequest.mockResolvedValue({
      id: 17,
      title: "JWT",
      body: "Token lifecycle",
      category: "security",
      published: true,
    });
  });

  it("creates content, returns success, and updates content cache tags", async () => {
    const formData = createContentFormData({
      title: " JWT ",
      body: " Token lifecycle ",
      category: " security ",
      published: "true",
    });

    const state = await saveManagedContentAction(
      initialSaveContentFormState,
      formData,
    );
    const options = mockedExecuteOpenApiRequest.mock.calls[0]?.[0];
    const createContent = vi.fn(async () => ({
      id: 17,
      title: "JWT",
      body: "Token lifecycle",
      category: "security",
      published: true,
    }));

    await options?.operation({ createContent });

    expect(mockedRequireSession).toHaveBeenCalledWith("/manage/content");
    expect(mockedGetApiBaseUrl).toHaveBeenCalledOnce();
    expect(options?.baseUrl).toBe("http://localhost:8080");
    expect(options?.tokens).toBe(managerSession.tokens);
    expect(createContent).toHaveBeenCalledWith({
      contentUpsertRequest: {
        title: "JWT",
        body: "Token lifecycle",
        category: "security",
        published: true,
      },
    });
    expect(mockedUpdateContentAfterMutation).toHaveBeenCalledWith(17);
    expect(state).toEqual({
      status: "success",
      message: "Content created.",
      error: null,
      contentId: 17,
    });
  });

  it("updates content with the content id and parsed upsert request", async () => {
    mockedExecuteOpenApiRequest.mockResolvedValueOnce({
      id: 23,
      title: "Draft",
      body: "Manager body",
      category: "security",
      published: false,
    });
    const formData = createContentFormData({
      id: "23",
      title: "Draft",
      body: "Manager body",
      category: "security",
      published: "false",
    });

    const state = await saveManagedContentAction(
      initialSaveContentFormState,
      formData,
    );
    const options = mockedExecuteOpenApiRequest.mock.calls[0]?.[0];
    const updateContent = vi.fn(async () => ({
      id: 23,
      title: "Draft",
      body: "Manager body",
      category: "security",
      published: false,
    }));

    await options?.operation({ updateContent });

    expect(updateContent).toHaveBeenCalledWith({
      contentId: 23,
      contentUpsertRequest: {
        title: "Draft",
        body: "Manager body",
        category: "security",
        published: false,
      },
    });
    expect(mockedUpdateContentAfterMutation).toHaveBeenCalledWith(23);
    expect(state).toEqual({
      status: "success",
      message: "Content updated.",
      error: null,
      contentId: 23,
    });
  });

  it("returns a bad request error for missing fields without calling the backend", async () => {
    const formData = createContentFormData({
      title: "JWT",
      body: "",
      category: "security",
    });

    const state = await saveManagedContentAction(
      initialSaveContentFormState,
      formData,
    );

    expect(mockedExecuteOpenApiRequest).not.toHaveBeenCalled();
    expect(state).toEqual({
      status: "error",
      message: null,
      error: {
        code: "ERROR_BAD_REQUEST",
        message: "Content fields are required.",
      },
    });
  });

  it("maps backend request errors to structured action errors", async () => {
    mockedExecuteOpenApiRequest.mockRejectedValue(
      new BackendRequestError("ERROR_ACCESS_DENIED", "No content access.", 403),
    );
    const formData = createContentFormData({
      title: "JWT",
      body: "Token lifecycle",
      category: "security",
      published: "true",
    });

    const state = await saveManagedContentAction(
      initialSaveContentFormState,
      formData,
    );

    expect(state).toEqual({
      status: "error",
      message: null,
      error: {
        code: "ERROR_ACCESS_DENIED",
        message: "No content access.",
      },
    });
  });

  it("calls forbidden for unauthorized non-manager sessions", async () => {
    mockedRequireSession.mockResolvedValue(userSession);
    const formData = createContentFormData({
      title: "JWT",
      body: "Token lifecycle",
      category: "security",
    });

    await expect(
      saveManagedContentAction(initialSaveContentFormState, formData),
    ).rejects.toThrow("forbidden");

    expect(mockedForbidden).toHaveBeenCalledOnce();
    expect(mockedExecuteOpenApiRequest).not.toHaveBeenCalled();
  });
});
