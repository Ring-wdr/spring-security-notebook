"use client";

import { AuthGuard } from "@/components/auth-guard";
import { apiRequest } from "@/lib/api-client";
import type { ContentSummary } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ContentListPage() {
  const [items, setItems] = useState<ContentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await apiRequest<ContentSummary[]>("/api/content");
        setItems(response);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "ERROR_CONTENT");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AuthGuard>
      <section className="panel space-y-6">
        <div className="space-y-3">
          <p className="eyebrow">Subscriber Content</p>
          <h1 className="text-3xl font-semibold">Published content feed</h1>
          <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
            These cards are loaded through the JWT-protected `GET /api/content`
            endpoint.
          </p>
        </div>
        {loading ? (
          <p className="text-sm text-[color:var(--muted-foreground)]">Loading content...</p>
        ) : error ? (
          <div className="rounded-[20px] border border-[color:var(--warn)]/35 bg-[color:var(--warn)]/12 px-4 py-3 text-sm text-[color:var(--warn)]">
            {error}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/content/${item.id}`}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--border-strong)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="badge">{item.category}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                    {item.published ? "Published" : "Draft"}
                  </p>
                </div>
                <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">
                  Open the detail page to inspect the protected fetch and role-aware visibility.
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AuthGuard>
  );
}
