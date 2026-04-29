import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  revalidateContentAfterMutation,
  updateContentAfterMutation,
} from "./content-cache-invalidation";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

import { revalidateTag, updateTag } from "next/cache";

const mockedRevalidateTag = vi.mocked(revalidateTag);
const mockedUpdateTag = vi.mocked(updateTag);

describe("content cache invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps stale-while-revalidate behavior for route handlers", () => {
    revalidateContentAfterMutation(7);

    expect(mockedRevalidateTag).toHaveBeenCalledWith("content", "max");
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      "content:published",
      "max",
    );
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      "content:management",
      "max",
    );
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      "content:detail:7",
      "max",
    );
  });

  it("immediately expires content tags for server actions", () => {
    updateContentAfterMutation(7);

    expect(mockedUpdateTag).toHaveBeenCalledWith("content");
    expect(mockedUpdateTag).toHaveBeenCalledWith("content:published");
    expect(mockedUpdateTag).toHaveBeenCalledWith("content:management");
    expect(mockedUpdateTag).toHaveBeenCalledWith("content:detail:7");
  });
});
