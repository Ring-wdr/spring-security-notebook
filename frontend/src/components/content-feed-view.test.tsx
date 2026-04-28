import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContentFeedView } from "./content-feed-view";
import type { ContentSummary } from "@/lib/types";

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

describe("ContentFeedView", () => {
  it("renders protected content rows with category and publication metadata", () => {
    const items: ContentSummary[] = [
      {
        id: 7,
        title: "JWT fundamentals",
        category: "Security",
        published: true,
      },
      {
        id: 8,
        title: "Role boundaries",
        category: "Authorization",
        published: false,
      },
    ];

    const { container } = render(<ContentFeedView items={items} />);

    expect(container.querySelectorAll(".dossier-surface")).toHaveLength(1);
    expect(container.querySelectorAll(".content-row")).toHaveLength(2);
    expect(screen.getByText("Security")).toBeInTheDocument();
    expect(screen.getByText("Authorization")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "JWT fundamentals" })).toHaveAttribute(
      "href",
      "/content/7",
    );
    expect(
      screen.getByRole("link", { name: "Role boundaries" }),
    ).toHaveAttribute("href", "/content/8");
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
