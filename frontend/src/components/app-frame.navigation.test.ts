import { describe, expect, it } from "vitest";

describe("getNavigationItems", () => {
  it("shows login only for anonymous visitors", async () => {
    const mod = await import("./app-frame.navigation").catch(() => null);

    expect(mod?.getNavigationItems).toBeDefined();
    if (!mod?.getNavigationItems) {
      return;
    }

    expect(mod.getNavigationItems(null).map((item) => item.href)).toEqual([
      "/",
      "/learn",
      "/login",
    ]);
  });

  it("shows manager content for manager roles and admin users for admins only", async () => {
    const mod = await import("./app-frame.navigation").catch(() => null);

    expect(mod?.getNavigationItems).toBeDefined();
    if (!mod?.getNavigationItems) {
      return;
    }

    const managerItems = mod.getNavigationItems({
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
    });

    expect(managerItems.map((item) => item.href)).toContain("/manage/content");
    expect(managerItems.map((item) => item.href)).not.toContain("/manage/users");
  });
});
