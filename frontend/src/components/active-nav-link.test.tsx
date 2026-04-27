import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ActiveNavLink } from "./active-nav-link";

const usePathname = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

describe("ActiveNavLink", () => {
  beforeEach(() => {
    usePathname.mockReset();
  });

  it("marks an exact pathname as active", () => {
    usePathname.mockReturnValue("/learn");

    render(<ActiveNavLink href="/learn" label="Learn" />);

    expect(screen.getByRole("link", { name: "Learn" }).className).toContain(
      "bg-[color:var(--accent)]",
    );
  });

  it("marks nested routes as active for non-root links", () => {
    usePathname.mockReturnValue("/manage/content/42");

    render(<ActiveNavLink href="/manage/content" label="Manage Content" />);

    expect(
      screen.getByRole("link", { name: "Manage Content" }).className,
    ).toContain("bg-[color:var(--accent)]");
  });

  it("keeps unrelated links inactive", () => {
    usePathname.mockReturnValue("/me");

    render(<ActiveNavLink href="/login" label="Login" />);

    expect(screen.getByRole("link", { name: "Login" }).className).toContain(
      "text-[color:var(--muted-foreground)]",
    );
  });
});
