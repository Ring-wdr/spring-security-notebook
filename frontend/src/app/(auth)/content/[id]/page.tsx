import { Suspense } from "react";
import Link from "next/link";
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
    <section className="panel space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <p className="eyebrow">Content Detail</p>
          <h1 className="text-3xl font-semibold">{item.title}</h1>
        </div>
        <Link href="/content" className="button-secondary">
          Back to list
        </Link>
      </div>

      <article className="space-y-5 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="badge">{item.category}</span>
          <span className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
            {item.published ? "Published" : "Draft"}
          </span>
        </div>
        <p className="text-base leading-8 text-[color:var(--muted-foreground)]">
          {item.body}
        </p>
      </article>
    </section>
  );
}
