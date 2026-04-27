"use client";

import { apiRequest } from "@/lib/api-client";
import type { ContentDetail, ContentSummary } from "@/lib/types";
import { type FormEvent, useState } from "react";

type EditorState = {
  id: number | null;
  title: string;
  body: string;
  category: string;
  published: boolean;
};

const EMPTY_EDITOR: EditorState = {
  id: null,
  title: "",
  body: "",
  category: "security",
  published: true,
};

export function ManageContentClient({
  initialItems,
}: {
  initialItems: ContentSummary[];
}) {
  const [items, setItems] = useState(initialItems);
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reloadContents() {
    const response = await apiRequest<ContentSummary[]>(
      "/api/content?includeAll=true",
    );
    setItems(response);
  }

  async function selectContent(contentId: number) {
    try {
      setLoadingDetailId(contentId);
      setError(null);
      const detail = await apiRequest<ContentDetail>(
        `/api/content/${contentId}?includeAll=true`,
      );
      setEditor({
        id: detail.id,
        title: detail.title,
        body: detail.body,
        category: detail.category,
        published: detail.published,
      });
      setMessage(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "ERROR_CONTENT");
    } finally {
      setLoadingDetailId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        title: editor.title,
        body: editor.body,
        category: editor.category,
        published: editor.published,
      };

      if (editor.id == null) {
        await apiRequest("/api/content", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Content created.");
      } else {
        await apiRequest(`/api/content/${editor.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setMessage("Content updated.");
      }

      setEditor(EMPTY_EDITOR);
      await reloadContents();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "ERROR_CONTENT");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="panel space-y-5">
        <div className="space-y-3">
          <p className="eyebrow">Manager Surface</p>
          <h1 className="text-3xl font-semibold">Create or update content</h1>
        </div>
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <input
            className="field"
            placeholder="Title"
            value={editor.title}
            onChange={(event) =>
              setEditor((current) => ({ ...current, title: event.target.value }))
            }
          />
          <input
            className="field"
            placeholder="Category"
            value={editor.category}
            onChange={(event) =>
              setEditor((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
          />
          <textarea
            className="field min-h-48"
            placeholder="Body"
            value={editor.body}
            onChange={(event) =>
              setEditor((current) => ({ ...current, body: event.target.value }))
            }
          />
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={editor.published}
              onChange={(event) =>
                setEditor((current) => ({
                  ...current,
                  published: event.target.checked,
                }))
              }
            />
            Publish immediately
          </label>
          <div className="flex flex-wrap gap-3">
            <button className="button-primary" disabled={saving}>
              {saving
                ? "Saving..."
                : editor.id == null
                  ? "Create content"
                  : "Update content"}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setEditor(EMPTY_EDITOR)}
            >
              Reset
            </button>
          </div>
          {message ? (
            <p className="text-sm text-[color:var(--accent)]">{message}</p>
          ) : null}
          {error ? <p className="text-sm text-[color:var(--warn)]">{error}</p> : null}
        </form>
      </section>

      <section className="panel space-y-5">
        <div className="space-y-3">
          <p className="eyebrow">Existing Items</p>
          <h2 className="text-2xl font-semibold">Review all content</h2>
        </div>
        <div className="grid gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-4 text-left transition hover:border-[color:var(--border-strong)]"
              onClick={() => void selectContent(item.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{item.title}</p>
                <span className="badge">
                  {loadingDetailId === item.id
                    ? "Loading..."
                    : item.published
                      ? "Published"
                      : "Draft"}
                </span>
              </div>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                {item.category}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
