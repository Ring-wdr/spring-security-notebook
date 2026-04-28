import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContentDetailWorkspace } from "./content-detail-workspace";
import type { ContentDetail } from "@/lib/types";

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

describe("ContentDetailWorkspace", () => {
  it("renders the protected detail record inside the dossier presenter seam", () => {
    const item: ContentDetail = {
      id: 42,
      title: "Protected JWT note",
      body: "Only authenticated subscribers should reach this document body.",
      category: "Security",
      published: true,
    };

    const { container } = render(<ContentDetailWorkspace item={item} />);

    expect(container.querySelectorAll(".dossier-surface")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Protected document" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Protected JWT note")).toBeInTheDocument();
    expect(screen.getByText("Only authenticated subscribers should reach this document body.")).toBeInTheDocument();
    expect(screen.getByText("Document metadata")).toBeInTheDocument();
    expect(screen.getAllByText("Security")).toHaveLength(2);
    expect(screen.getAllByText("Published")).toHaveLength(2);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to list" })).toHaveAttribute(
      "href",
      "/content",
    );
  });
});
