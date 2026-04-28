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
  it("renders protected content as dossier rows with a link for each item", () => {
    const items: ContentSummary[] = [
      {
        id: 7,
        title: "JWT fundamentals",
        category: "Security",
        published: true,
      },
    ];

    const { container } = render(<ContentFeedView items={items} />);

    expect(container.querySelectorAll(".dossier-surface")).toHaveLength(1);
    expect(container.querySelectorAll(".content-row")).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: /JWT fundamentals/i }),
    ).toHaveAttribute("href", "/content/7");
  });
});
