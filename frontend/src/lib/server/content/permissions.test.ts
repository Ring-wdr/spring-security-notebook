import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedSession } from "@/lib/types";

import { canManageContent } from "./permissions";

vi.mock("server-only", () => ({}));

const baseSession: AuthenticatedSession = {
  tokens: {
    grantType: "Bearer",
    accessToken: "access-token",
    refreshToken: "refresh-token",
    accessTokenExpiresIn: 600,
    refreshTokenExpiresIn: 86400,
  },
  user: {
    id: 1,
    email: "user@example.com",
    nickname: "user",
    roleNames: ["ROLE_USER"],
  },
};

describe("content permissions", () => {
  it("allows managers and admins to manage content", () => {
    expect(
      canManageContent({
        ...baseSession,
        user: { ...baseSession.user, roleNames: ["ROLE_MANAGER"] },
      }),
    ).toBe(true);
    expect(
      canManageContent({
        ...baseSession,
        user: { ...baseSession.user, roleNames: ["ROLE_ADMIN"] },
      }),
    ).toBe(true);
  });

  it("rejects regular users from content management", () => {
    expect(canManageContent(baseSession)).toBe(false);
  });
});
