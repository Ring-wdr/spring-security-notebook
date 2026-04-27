import { describe, expect, it } from "vitest";

import {
  buildRefreshSessionRedirectPath,
  sanitizeReturnTo,
} from "./route";

describe("sanitizeReturnTo", () => {
  it("keeps same-origin absolute paths only", () => {
    expect(sanitizeReturnTo("/me")).toBe("/me");
    expect(sanitizeReturnTo("/manage/content?includeAll=true")).toBe(
      "/manage/content?includeAll=true",
    );
    expect(sanitizeReturnTo("https://evil.example/steal")).toBe("/me");
    expect(sanitizeReturnTo("content")).toBe("/me");
    expect(sanitizeReturnTo("")).toBe("/me");
  });
});

describe("buildRefreshSessionRedirectPath", () => {
  it("encodes the return path for the internal refresh route", () => {
    expect(buildRefreshSessionRedirectPath("/manage/users?tab=roles")).toBe(
      "/auth/refresh-session?returnTo=%2Fmanage%2Fusers%3Ftab%3Droles",
    );
  });
});
