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
const fakeCreateContent = vi.fn();
const fakeUpdateContent = vi.fn();

function createContentFormData(values: {
  id?: string | Blob;
  title?: string | Blob;
  body?: string | Blob;
  category?: string | Blob;
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
    fakeCreateContent.mockResolvedValue({
      id: 41,
      title: "Created JWT",
      body: "Created lifecycle",
      category: "security",
      published: true,
    });
    fakeUpdateContent.mockResolvedValue({
      id: 67,
      title: "Updated Draft",
      body: "Updated manager body",
      category: "security",
      published: false,
    });
    mockedExecuteOpenApiRequest.mockImplementation(async (options) => {
      return options.operation({
        createContent: fakeCreateContent,
        updateContent: fakeUpdateContent,
      });
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

    expect(mockedRequireSession).toHaveBeenCalledWith("/manage/content");
    expect(mockedGetApiBaseUrl).toHaveBeenCalledOnce();
    expect(options?.baseUrl).toBe("http://localhost:8080");
    expect(options?.tokens).toBe(managerSession.tokens);
    expect(fakeCreateContent).toHaveBeenCalledWith({
      contentUpsertRequest: {
        title: "JWT",
        body: "Token lifecycle",
        category: "security",
        published: true,
      },
    });
    expect(fakeUpdateContent).not.toHaveBeenCalled();
    expect(mockedUpdateContentAfterMutation).toHaveBeenCalledWith(41);
    expect(state).toEqual({
      status: "success",
      message: "Content created.",
      error: null,
      contentId: 41,
    });
  });

  it("updates content with the content id and parsed upsert request", async () => {
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

    expect(fakeCreateContent).not.toHaveBeenCalled();
    expect(fakeUpdateContent).toHaveBeenCalledWith({
      contentId: 23,
      contentUpsertRequest: {
        title: "Draft",
        body: "Manager body",
        category: "security",
        published: false,
      },
    });
    expect(mockedUpdateContentAfterMutation).toHaveBeenCalledWith(67);
    expect(state).toEqual({
      status: "success",
      message: "Content updated.",
      error: null,
      contentId: 67,
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

  it.each(["abc", "NaN", "12.5", "0", "-7", "1e2", "0x10", " 23 "])(
    "returns a bad request error for an invalid submitted id %s without calling the backend",
    async (id) => {
      const formData = createContentFormData({
        id,
        title: "JWT",
        body: "Token lifecycle",
        category: "security",
      });

      const state = await saveManagedContentAction(
        initialSaveContentFormState,
        formData,
      );

      expect(mockedExecuteOpenApiRequest).not.toHaveBeenCalled();
      expect(mockedUpdateContentAfterMutation).not.toHaveBeenCalled();
      expect(state).toEqual({
        status: "error",
        message: null,
        error: {
          code: "ERROR_BAD_REQUEST",
          message: "Content id is invalid.",
        },
      });
    },
  );

  it("returns a bad request error for file values submitted as text fields without calling the backend", async () => {
    const formData = createContentFormData({
      title: new File(["not text"], "title.txt", { type: "text/plain" }),
      body: "Token lifecycle",
      category: "security",
    });

    const state = await saveManagedContentAction(
      initialSaveContentFormState,
      formData,
    );

    expect(mockedExecuteOpenApiRequest).not.toHaveBeenCalled();
    expect(mockedUpdateContentAfterMutation).not.toHaveBeenCalled();
    expect(state).toEqual({
      status: "error",
      message: null,
      error: {
        code: "ERROR_BAD_REQUEST",
        message: "Content fields are required.",
      },
    });
  });

  it("returns a bad request error for file values submitted as the id without calling the backend", async () => {
    const formData = createContentFormData({
      id: new File(["23"], "id.txt", { type: "text/plain" }),
      title: "JWT",
      body: "Token lifecycle",
      category: "security",
    });

    const state = await saveManagedContentAction(
      initialSaveContentFormState,
      formData,
    );

    expect(mockedExecuteOpenApiRequest).not.toHaveBeenCalled();
    expect(mockedUpdateContentAfterMutation).not.toHaveBeenCalled();
    expect(state).toEqual({
      status: "error",
      message: null,
      error: {
        code: "ERROR_BAD_REQUEST",
        message: "Content id is invalid.",
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
    expect(mockedUpdateContentAfterMutation).not.toHaveBeenCalled();
  });

  it("maps unknown backend errors to the generic content action error without updating caches", async () => {
    mockedExecuteOpenApiRequest.mockRejectedValue(new Error("network down"));
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
        code: "ERROR_CONTENT",
        message: "ERROR_CONTENT",
      },
    });
    expect(mockedUpdateContentAfterMutation).not.toHaveBeenCalled();
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
