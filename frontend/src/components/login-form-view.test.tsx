import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("LoginFormView", () => {
  it("renders the seeded defaults and submit label", async () => {
    const mod = await import("./login-form-view").catch(() => null);

    expect(mod?.LoginFormView).toBeDefined();
    if (!mod?.LoginFormView) {
      return;
    }

    render(<mod.LoginFormView />);

    expect(screen.getByDisplayValue("user@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1111")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("shows the current display error", async () => {
    const mod = await import("./login-form-view").catch(() => null);

    expect(mod?.LoginFormView).toBeDefined();
    if (!mod?.LoginFormView) {
      return;
    }

    render(
      <mod.LoginFormView
        error={{
          code: "ERROR_LOGIN",
          message: "Login failed.",
        }}
      />,
    );

    expect(screen.getByText("ERROR_LOGIN")).toBeInTheDocument();
    expect(screen.getByText("Login failed.")).toBeInTheDocument();
  });

  it("disables submit while pending", async () => {
    const mod = await import("./login-form-view").catch(() => null);

    expect(mod?.LoginFormView).toBeDefined();
    if (!mod?.LoginFormView) {
      return;
    }

    render(<mod.LoginFormView pending />);

    expect(screen.getByRole("button", { name: "Signing in..." })).toBeDisabled();
  });
});
