"use client";

import { AuthGuard } from "@/components/auth-guard";
import { apiRequest } from "@/lib/api-client";
import type { ContentDetail } from "@/lib/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ContentDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await apiRequest<ContentDetail>(`/api/content/${params.id}`);
        setItem(response);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "ERROR_CONTENT");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  return (
    <AuthGuard>
      <section className="panel space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <p className="eyebrow">Content Detail</p>
            <h1 className="text-3xl font-semibold">
              {loading ? "Loading..." : item?.title ?? "Content"}
            </h1>
          </div>
          <Link href="/content" className="button-secondary">
            Back to list
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-[color:var(--muted-foreground)]">Loading detail...</p>
        ) : error ? (
          <div className="rounded-[20px] border border-[color:var(--warn)]/35 bg-[color:var(--warn)]/12 px-4 py-3 text-sm text-[color:var(--warn)]">
            {error}
          </div>
        ) : item ? (
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
        ) : null}
      </section>
    </AuthGuard>
  );
}
