import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadManagedContentWorkspaceData } from "./workspace-data";
import {
  getManagedContentDetailForRequest,
  getManagedContentSummariesForRequest,
} from "@/lib/server/content/content-dal";
import { unstable_rethrow } from "next/navigation";

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  unstable_rethrow: vi.fn(),
}));

vi.mock("@/lib/server/content/content-dal", () => ({
  getManagedContentDetailForRequest: vi.fn(),
  getManagedContentSummariesForRequest: vi.fn(),
}));

const mockedGetSummaries = vi.mocked(getManagedContentSummariesForRequest);
const mockedGetDetail = vi.mocked(getManagedContentDetailForRequest);
const mockedUnstableRethrow = vi.mocked(unstable_rethrow);

describe("loadManagedContentWorkspaceData", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("loads summaries with a returnTo that preserves the selected content id", async () => {
    mockedGetSummaries.mockResolvedValue([]);
    mockedGetDetail.mockResolvedValue({
      id: 123,
      title: "JWT Basics",
      body: "Body",
      category: "security",
      published: false,
    });

    await loadManagedContentWorkspaceData({
      contentId: "123",
    });

    expect(mockedGetSummaries).toHaveBeenCalledWith(
      "/manage/content?contentId=123",
    );
    expect(mockedGetDetail).toHaveBeenCalledWith("123");
  });

  it("does not swallow Next router errors while falling back from selected detail", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    mockedGetSummaries.mockResolvedValue([]);
    mockedGetDetail.mockRejectedValue(redirectError);
    mockedUnstableRethrow.mockImplementation((error) => {
      throw error;
    });

    await expect(
      loadManagedContentWorkspaceData({
        contentId: "123",
      }),
    ).rejects.toBe(redirectError);
  });

  it("keeps the content workspace usable when selected detail cannot load", async () => {
    const detailError = new Error("missing content");
    mockedGetSummaries.mockResolvedValue([
      {
        id: 1,
        title: "JWT Basics",
        category: "security",
        published: true,
      },
    ]);
    mockedGetDetail.mockRejectedValue(detailError);

    const data = await loadManagedContentWorkspaceData({
      contentId: "123",
    });

    expect(mockedUnstableRethrow).toHaveBeenCalledWith(detailError);
    expect(mockedGetDetail).toHaveBeenCalledWith("123");
    expect(data).toEqual({
      items: [
        {
          id: 1,
          title: "JWT Basics",
          category: "security",
          published: true,
        },
      ],
      selectedDetail: null,
    });
  });
});
