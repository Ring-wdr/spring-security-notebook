import { describe, expect, it } from "vitest";

import {
  LECTURE_AUDIT_ITEMS,
  createLearningSnapshot,
  describeProtectedRouteAccess,
} from "./learn";
import type { AuthenticatedSession } from "./types";

const AUTHENTICATED_SESSION: AuthenticatedSession = {
  tokens: {
    grantType: "Bearer",
    accessToken: "access-token",
    refreshToken: "refresh-token",
    accessTokenExpiresIn: 600,
    refreshTokenExpiresIn: 86400,
  },
  user: {
    email: "manager@example.com",
    nickname: "manager",
    social: false,
    roleNames: ["ROLE_MANAGER"],
  },
};

describe("createLearningSnapshot", () => {
  it("describes the anonymous learning state without exposing token values", () => {
    const snapshot = createLearningSnapshot(null);

    expect(snapshot.state).toBe("anonymous");
    expect(snapshot.primaryMessage).toContain("Log in");
    expect(snapshot.tokenMetadata).toEqual([]);
  });

  it("summarizes the authenticated session with token metadata only", () => {
    const snapshot = createLearningSnapshot(AUTHENTICATED_SESSION);

    expect(snapshot.state).toBe("authenticated");
    expect(snapshot.primaryMessage).toContain("manager@example.com");
    expect(snapshot.tokenMetadata).toEqual([
      { label: "Grant type", value: "Bearer" },
      { label: "Access token TTL", value: "600 sec" },
      { label: "Refresh token TTL", value: "86400 sec" },
      {
        label: "Refresh behavior",
        value: "Protected server routes redirect through refresh-session, then retry with rotated tokens.",
      },
      {
        label: "Logout effect",
        value: "Logout revokes the current access token and removes the stored refresh token.",
      },
    ]);
  });
});

describe("describeProtectedRouteAccess", () => {
  it("explains unauthorized and forbidden responses with stable codes", () => {
    expect(describeProtectedRouteAccess("unauthorized")).toEqual({
      status: 401,
      code: "ERROR_ACCESS_TOKEN",
      summary: "Authentication is required or the access token is invalid.",
    });
    expect(describeProtectedRouteAccess("forbidden")).toEqual({
      status: 403,
      code: "ERROR_ACCESS_DENIED",
      summary: "You do not have permission.",
    });
  });
});

describe("LECTURE_AUDIT_ITEMS", () => {
  it("covers all ten lecture steps for the learning guide", () => {
    expect(LECTURE_AUDIT_ITEMS).toHaveLength(10);
    expect(LECTURE_AUDIT_ITEMS.map((item) => item.step)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(LECTURE_AUDIT_ITEMS.some((item) => item.status === "implemented_by_this_phase")).toBe(
      true,
    );
  });
});
