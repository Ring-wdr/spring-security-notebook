"use client";

import { DossierRail, DossierSection, DossierSurface } from "@/components/dossier";
import { ApiClientError, apiRequest, backendApi } from "@/lib/api-client";
import type { ContentDetail, ContentSummary } from "@/lib/types";
import {
  startTransition,
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

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
  selectedDetail,
}: {
  initialItems: ContentSummary[];
  selectedDetail?: ContentDetail | null;
}) {
  const editorFieldPrefix = useId();
  const selectedDetailId = selectedDetail?.id;
  const lastSyncedDetailId = useRef(selectedDetailId);
  const [items, setItems] = useState(initialItems);
  const [editor, setEditor] = useState<EditorState>(
    selectedDetail ? toEditorState(selectedDetail) : EMPTY_EDITOR,
  );
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  useEffect(() => {
    if (selectedDetail == null) {
      lastSyncedDetailId.current = undefined;
      return;
    }

    if (lastSyncedDetailId.current === selectedDetail.id) {
      return;
    }

    lastSyncedDetailId.current = selectedDetail.id;
    startTransition(() => {
      setEditor(toEditorState(selectedDetail));
    });
  }, [selectedDetail]);

  async function reloadContents() {
    const response = await fetchManagedContentSummaries();
    setItems(response);
  }

  async function selectContent(contentId: number) {
    try {
      setLoadingDetailId(contentId);
      setError(null);
      const detail = await fetchManagedContentDetail(contentId);
      setEditor(toEditorState(detail));
      setMessage(null);
    } catch (nextError) {
      setError(toContentError(nextError));
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
        await apiRequest(() =>
          backendApi.content.createContent({
            contentUpsertRequest: payload,
          }),
        );
        setMessage("Content created.");
      } else {
        const contentId = editor.id;
        await apiRequest(() =>
          backendApi.content.updateContent({
            contentId,
            contentUpsertRequest: payload,
          }),
        );
        setMessage("Content updated.");
      }

      setEditor(EMPTY_EDITOR);
      await reloadContents();
    } catch (nextError) {
      setError(toContentError(nextError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DossierSurface
      eyebrow="Manager Surface"
      title="Content authoring workspace"
      intro="Draft, revise, and publish secured content from one manager-facing surface while keeping the registry visible beside the editor."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,_1.1fr)_minmax(320px,_0.9fr)]">
        <DossierSection heading="Create or update content">
          <div className="space-y-5">
            <div className="rounded-[20px] border border-[color:var(--dossier-border)] bg-[color:var(--dossier-surface)] px-4 py-4 text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
              Select an existing entry to load it into the editor, or stay on the
              blank state to publish a new protected content document.
            </div>
            <form
              className="space-y-4"
              onSubmit={(event) => void handleSubmit(event)}
            >
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor={`${editorFieldPrefix}-title`}
                >
                  Title
                </label>
                <input
                  id={`${editorFieldPrefix}-title`}
                  className="field"
                  value={editor.title}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor={`${editorFieldPrefix}-category`}
                >
                  Category
                </label>
                <input
                  id={`${editorFieldPrefix}-category`}
                  className="field"
                  value={editor.category}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor={`${editorFieldPrefix}-body`}
                >
                  Body
                </label>
                <textarea
                  id={`${editorFieldPrefix}-body`}
                  className="field min-h-48"
                  value={editor.body}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      body: event.target.value,
                    }))
                  }
                />
              </div>
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
              {error ? (
                <div className="text-sm text-[color:var(--warn)]">
                  <p className="font-semibold">{error.code}</p>
                  <p className="mt-1">{error.message}</p>
                </div>
              ) : null}
            </form>
          </div>
        </DossierSection>

        <DossierRail heading="Content registry">
          <div className="space-y-3">
            <p className="text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
              Review every content record, then reopen one item at a time in the
              editing workspace to revise its protected details.
            </p>
            <div className="grid gap-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-[22px] border border-[color:var(--dossier-border)] bg-[color:var(--dossier-surface-strong)] px-4 py-4 text-left transition hover:border-[color:var(--dossier-border-strong)]"
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
                  <p className="mt-2 text-sm text-[color:var(--dossier-muted-foreground)]">
                    {item.category}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </DossierRail>
      </div>
    </DossierSurface>
  );
}

function toEditorState(detail: ContentDetail): EditorState {
  return {
    id: detail.id,
    title: detail.title,
    body: detail.body,
    category: detail.category,
    published: detail.published,
  };
}

function toContentError(error: unknown) {
  if (error instanceof ApiClientError) {
    return {
      code: error.code,
      message: error.displayMessage,
    };
  }

  return {
    code: "ERROR_CONTENT",
    message: "Unable to complete the content request.",
  };
}

async function fetchManagedContentSummaries(): Promise<ContentSummary[]> {
  return fetchManagedContent("/api/manage/content");
}

async function fetchManagedContentDetail(id: number): Promise<ContentDetail> {
  return fetchManagedContent(`/api/manage/content/${id}`);
}

async function fetchManagedContent<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) {
    await extractManagedContentError(response);
  }

  return (await response.json()) as T;
}

async function extractManagedContentError(response: Response): Promise<never> {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    throw new ApiClientError(
      data.error ?? `HTTP_${response.status}`,
      data.message ?? `HTTP_${response.status}`,
      response.status,
    );
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(
      `HTTP_${response.status}`,
      `HTTP_${response.status}`,
      response.status,
    );
  }
}
