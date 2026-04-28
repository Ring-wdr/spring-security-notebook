import Link from "next/link";

import { DossierSection, DossierSurface } from "@/components/dossier";
import type { ContentSummary } from "@/lib/types";

type ContentFeedViewProps = {
  items: ContentSummary[];
};

export function ContentFeedView({ items }: ContentFeedViewProps) {
  return (
    <DossierSurface
      eyebrow="Subscriber Content"
      title="Protected content index"
      intro="This subscriber-only feed is loaded through the JWT-protected GET /api/content endpoint. Each entry stays lightweight so the view reads like a protected document index rather than a gallery."
    >
      <DossierSection heading="Published content feed">
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="content-row rounded-[22px] border border-[color:var(--dossier-border)] bg-[color:var(--dossier-surface-strong)] px-5 py-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="badge">{item.category}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--dossier-muted-foreground)]">
                      {item.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">
                      {item.title}
                    </h2>
                    <p className="text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
                      Open the protected document to inspect the detail fetch and
                      content body in the same secured session.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/content/${item.id}`}
                  className="button-secondary shrink-0"
                >
                  {item.title}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </DossierSection>
    </DossierSurface>
  );
}
