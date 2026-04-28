import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LearnWorkspaceView } from "./learn-workspace-view";
import type { LearningSnapshot } from "@/lib/learn";

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    ...rest
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

describe("LearnWorkspaceView", () => {
  it("renders the learn presenter as one dossier surface", () => {
    const snapshot: LearningSnapshot = {
      state: "anonymous",
      primaryMessage:
        "Log in with a seeded account to inspect the current principal, token TTL metadata, and protected-route behavior.",
      tokenMetadata: [],
      roleNames: [],
    };

    const unauthorizedRoute = {
      status: 401 as const,
      code: "ERROR_ACCESS_TOKEN",
      summary: "Authentication is required or the access token is invalid.",
    };

    const forbiddenRoute = {
      status: 403 as const,
      code: "ERROR_ACCESS_DENIED",
      summary: "You do not have permission.",
    };

    const { container } = render(
      <LearnWorkspaceView
        snapshot={snapshot}
        unauthorizedRoute={unauthorizedRoute}
        forbiddenRoute={forbiddenRoute}
      />,
    );

    expect(container.querySelectorAll(".dossier-surface")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Implementation guide" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Guided route checks" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Lecture audit" }),
    ).toBeInTheDocument();
  });
});
