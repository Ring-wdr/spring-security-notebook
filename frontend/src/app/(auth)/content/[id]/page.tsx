import { Suspense } from "react";
import Link from "next/link";

import {
  DataTile,
  DossierRail,
  DossierSection,
  DossierSurface,
} from "@/components/dossier";
import { GuardPanel } from "@/components/guard-panel";
import { fetchProtectedJson } from "@/lib/server/session";
import type { ContentDetail } from "@/lib/types";

export default function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <GuardPanel
          eyebrow="Content Detail"
          title="Loading protected content..."
          body="Fetching the selected content record from the secured backend."
        />
      }
    >
      <ContentDetailSection params={params} />
    </Suspense>
  );
}

async function ContentDetailSection({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await fetchProtectedJson<ContentDetail>(
    `/api/content/${id}`,
    `/content/${id}`,
  );

  return (
    <DossierSurface
      eyebrow="Protected Content"
      title={item.title}
      intro="This detail view is fetched through the secured content endpoint and rendered in the same dossier language as the rest of the protected workspace."
    >
      <div className="flex items-start justify-end">
        <Link href="/content" className="button-secondary">
          Back to list
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,_1.15fr)_minmax(300px,_0.85fr)]">
        <DossierSection heading="Protected document">
          <article className="space-y-5 rounded-[22px] border border-[color:var(--dossier-border)] bg-[color:var(--dossier-surface-strong)] px-5 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="badge">{item.category}</span>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--dossier-muted-foreground)]">
                {item.published ? "Published" : "Draft"}
              </span>
            </div>
            <p className="text-base leading-8 text-[color:var(--dossier-muted-foreground)]">
              {item.body}
            </p>
          </article>
        </DossierSection>

        <DossierRail heading="Document metadata">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
              The detail request remains protected by the server-side session
              helpers, so this record only resolves for an authenticated
              subscriber.
            </p>
            <div className="grid gap-3">
              <DataTile label="Category" value={item.category} />
              <DataTile
                label="Visibility"
                value={item.published ? "Published" : "Draft"}
              />
              <DataTile label="Content ID" value={String(item.id)} />
            </div>
          </div>
        </DossierRail>
      </div>
    </DossierSurface>
  );
}
