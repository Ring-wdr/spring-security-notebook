import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LearnPageSkeleton } from "@/components/learn-page-skeleton";
import {
  describeProtectedRouteAccess,
  type LearningSnapshot,
} from "@/lib/learn";
import { LearnWorkspaceView } from "./learn-workspace-view";

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

const UNAUTHORIZED_ROUTE = describeProtectedRouteAccess("unauthorized");
const FORBIDDEN_ROUTE = describeProtectedRouteAccess("forbidden");

function renderLearnWorkspaceView(snapshot: LearningSnapshot) {
  return render(
    <LearnWorkspaceView
      snapshot={snapshot}
      unauthorizedRoute={UNAUTHORIZED_ROUTE}
      forbiddenRoute={FORBIDDEN_ROUTE}
    />,
  );
}

describe("LearnWorkspaceView", () => {
  it("renders the anonymous fallback copy when token metadata is not available", () => {
    const snapshot: LearningSnapshot = {
      state: "anonymous",
      primaryMessage:
        "Log in with a seeded account to inspect the current principal, token TTL metadata, and protected-route behavior.",
      tokenMetadata: [],
      roleNames: [],
    };

    const { container } = renderLearnWorkspaceView(snapshot);

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
    expect(
      screen.getByText("Sign in to inspect granted authorities"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Token metadata appears after login. Use a seeded account, then come back to compare access and refresh TTL values.",
      ),
    ).toBeInTheDocument();
  });

  it("renders authenticated role badges in the current auth state rail", () => {
    const snapshot: LearningSnapshot = {
      state: "authenticated",
      primaryMessage:
        "Authenticated as manager@example.com with ROLE_MANAGER, ROLE_ADMIN.",
      tokenMetadata: [],
      roleNames: ["ROLE_MANAGER", "ROLE_ADMIN"],
    };

    renderLearnWorkspaceView(snapshot);

    const authRail = screen
      .getByRole("heading", { name: "Current auth state" })
      .closest("section");

    expect(authRail).not.toBeNull();
    expect(within(authRail!).getByText("authenticated")).toBeInTheDocument();
    expect(within(authRail!).getByText("ROLE_MANAGER")).toBeInTheDocument();
    expect(within(authRail!).getByText("ROLE_ADMIN")).toBeInTheDocument();
    expect(
      within(authRail!).queryByText("Sign in to inspect granted authorities"),
    ).not.toBeInTheDocument();
  });

  it("renders token metadata when the current session snapshot includes it", () => {
    const snapshot: LearningSnapshot = {
      state: "authenticated",
      primaryMessage:
        "Authenticated as admin@example.com with ROLE_ADMIN.",
      roleNames: ["ROLE_ADMIN"],
      tokenMetadata: [
        { label: "Grant type", value: "Bearer" },
        { label: "Access token TTL", value: "600 sec" },
      ],
    };

    renderLearnWorkspaceView(snapshot);

    expect(screen.getByText("Grant type")).toBeInTheDocument();
    expect(screen.getByText("Bearer")).toBeInTheDocument();
    expect(screen.getByText("Access token TTL")).toBeInTheDocument();
    expect(screen.getByText("600 sec")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Token metadata appears after login. Use a seeded account, then come back to compare access and refresh TTL values.",
      ),
    ).not.toBeInTheDocument();
  });
});

describe("LearnPageSkeleton", () => {
  it("uses the dossier shell language while the learning snapshot is loading", () => {
    const { container } = render(<LearnPageSkeleton />);

    expect(container.querySelectorAll(".dossier-surface")).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        name: "Spring Security and JWT implementation guide",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Current auth state" }),
    ).toBeInTheDocument();
  });
});
