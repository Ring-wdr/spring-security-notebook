import { describe, expect, it, vi } from "vitest";

import { loadManagedContentWorkspaceData } from "./workspace-data";
import {
  getManagedContentDetailForRequest,
  getManagedContentSummariesForRequest,
} from "@/lib/server/content/content-dal";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/server/content/content-dal", () => ({
  getManagedContentDetailForRequest: vi.fn(),
  getManagedContentSummariesForRequest: vi.fn(),
}));

const mockedGetSummaries = vi.mocked(getManagedContentSummariesForRequest);
const mockedGetDetail = vi.mocked(getManagedContentDetailForRequest);

describe("loadManagedContentWorkspaceData", () => {
  it("keeps the content workspace usable when selected detail cannot load", async () => {
    mockedGetSummaries.mockResolvedValue([
      {
        id: 1,
        title: "JWT Basics",
        category: "security",
        published: true,
      },
    ]);
    mockedGetDetail.mockRejectedValue(new Error("missing content"));

    const data = await loadManagedContentWorkspaceData({
      contentId: "123",
    });

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
