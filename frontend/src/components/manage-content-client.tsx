"use client";

import type { Route } from "next";
import {
  initialSaveContentFormState,
  saveManagedContentAction,
} from "@/app/actions/content";
import { DossierRail, DossierSection, DossierSurface } from "@/components/dossier";
import type { ContentDetail, ContentSummary } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import {
  startTransition,
  type FormEvent,
  useActionState,
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
  selectedDetail: ContentDetail | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorFieldPrefix = useId();
  const [saveState, formAction, saving] = useActionState(
    saveManagedContentAction,
    initialSaveContentFormState,
  );
  const [items, setItems] = useState(initialItems);
  const [editor, setEditor] = useState<EditorState>(
    selectedDetail ? toEditorState(selectedDetail) : EMPTY_EDITOR,
  );
  const lastHandledSuccess = useRef<typeof saveState | null>(null);

  useEffect(() => {
    startTransition(() => {
      setItems(initialItems);
    });
  }, [initialItems]);

  useEffect(() => {
    startTransition(() => {
      setEditor(selectedDetail ? toEditorState(selectedDetail) : EMPTY_EDITOR);
    });
  }, [selectedDetail]);

  useEffect(() => {
    if (
      saveState.status !== "success" ||
      lastHandledSuccess.current === saveState
    ) {
      return;
    }

    lastHandledSuccess.current = saveState;
    startTransition(() => {
      setEditor(EMPTY_EDITOR);
    });
    const params = new URLSearchParams(searchParams.toString());
    params.delete("contentId");
    const nextPath = params.toString()
      ? `/manage/content?${params.toString()}`
      : "/manage/content";
    router.replace(nextPath as Route);
    router.refresh();
  }, [router, saveState, searchParams]);

  function selectContent(contentId: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("contentId", String(contentId));
    router.replace(`/manage/content?${params.toString()}` as Route);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
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
              onSubmit={handleSubmit}
            >
              <input type="hidden" name="id" value={editor.id ?? ""} />
              <input
                type="hidden"
                name="published"
                value={editor.published ? "true" : "false"}
              />
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor={`${editorFieldPrefix}-title`}
                >
                  Title
                </label>
                <input
                  id={`${editorFieldPrefix}-title`}
                  name="title"
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
                  name="category"
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
                  name="body"
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
              {saveState.message ? (
                <p className="text-sm text-[color:var(--accent)]">
                  {saveState.message}
                </p>
              ) : null}
              {saveState.error ? (
                <div className="text-sm text-[color:var(--warn)]">
                  <p className="font-semibold">{saveState.error.code}</p>
                  <p className="mt-1">{saveState.error.message}</p>
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
                  onClick={() => selectContent(item.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.title}</p>
                    <span className="badge">
                      {item.published ? "Published" : "Draft"}
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
