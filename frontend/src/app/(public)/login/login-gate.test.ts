import { describe, expect, it } from "vitest";

describe("getLoginGateState", () => {
  it("prefers an authenticated session redirect to /me", async () => {
    const mod = await import("./login-gate").catch(() => null);

    expect(mod?.getLoginGateState).toBeDefined();
    if (!mod?.getLoginGateState) {
      return;
    }

    expect(
      mod.getLoginGateState({
        hasSession: true,
        hasSessionCookie: true,
        errorParam: undefined,
      }),
    ).toEqual({
      type: "redirect",
      location: "/me",
    });
  });

  it("redirects session cookies through refresh before showing the form", async () => {
    const mod = await import("./login-gate").catch(() => null);

    expect(mod?.getLoginGateState).toBeDefined();
    if (!mod?.getLoginGateState) {
      return;
    }

    expect(
      mod.getLoginGateState({
        hasSession: false,
        hasSessionCookie: true,
        errorParam: undefined,
      }),
    ).toEqual({
      type: "redirect",
      location: "/auth/refresh-session?returnTo=%2Fme",
    });
  });

  it("turns an error query into the initial display error when no redirect is needed", async () => {
    const mod = await import("./login-gate").catch(() => null);

    expect(mod?.getLoginGateState).toBeDefined();
    if (!mod?.getLoginGateState) {
      return;
    }

    expect(
      mod.getLoginGateState({
        hasSession: false,
        hasSessionCookie: false,
        errorParam: "ERROR_LOGIN",
      }),
    ).toEqual({
      type: "render",
      initialError: {
        code: "ERROR_LOGIN",
        message: "Login failed.",
      },
    });
  });
});
