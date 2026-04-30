# Content Server Actions Cache Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the content management client-side fetch and mutation flow with Next.js 16 Cache Components-friendly Server Component reads, Server Actions, and tag invalidation.

**Architecture:** The management page will treat the selected content id as server state in the URL query string. Server Components will load the list and selected detail through the existing DAL under Suspense, while the client component remains responsible only for local form interactivity. Content create/update mutations will move to a Server Action that performs auth/authorization, calls the backend OpenAPI client, and uses `updateTag` for read-your-own-writes cache expiry.

**Tech Stack:** Next.js 16.2.4 App Router, Cache Components (`use cache`, `cacheLife`, `cacheTag`), React 19 `useActionState`, TypeScript, Vitest, Testing Library, MSW, next-browser.

---

## Context And Source Of Truth

Read these before editing:

- `frontend/AGENTS.md`: frontend test and Next.js documentation rules.
- `frontend/node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`: Server Functions and Server Actions.
- `frontend/node_modules/next/dist/docs/01-app/01-getting-started/09-revalidating.md`: `revalidateTag`, `updateTag`, and `revalidatePath` with Cache Components.
- `frontend/node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`: Next 16 Cache Components migration rules.
- `frontend/node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`: Server Component data fetching and Suspense streaming.

Important decisions from those docs:

- Server Component `fetch` and OpenAPI calls are not cached by default. Cached content must be behind `"use cache"`, `cacheLife`, and `cacheTag`.
- `revalidateTag(tag, "max")` gives stale-while-revalidate behavior and can be called from Server Actions or Route Handlers.
- `updateTag(tag)` immediately expires a tag for read-your-own-writes and can only be called from Server Actions.
- Server Actions are reachable by POST, so every action must repeat authentication and authorization checks.

## File Structure

- Modify `frontend/src/lib/server/content/content-cache-invalidation.ts`
  - Keep the existing Route Handler-compatible `revalidateContentAfterMutation()`.
  - Add `updateContentAfterMutation()` for Server Actions using `updateTag`.
- Create `frontend/src/app/actions/content.ts`
  - Server Action state types.
  - `saveManagedContentAction(previousState, formData)`.
  - FormData parsing and backend error mapping.
- Modify `frontend/src/lib/server/content/content-dal.ts`
  - Add `getManagedContentDetailForRequest(id)` so the management page can SSR the selected detail with manager authorization.
- Modify `frontend/src/lib/server/content/content-dal.test.ts`
  - Cover selected management detail reads and authorization behavior.
- Modify `frontend/src/app/(auth)/manage/content/page.tsx`
  - Read `searchParams.contentId`.
  - Load the list and optional detail on the server under Suspense.
  - Pass `selectedDetail` into the client component.
- Modify `frontend/src/components/manage-content-client.tsx`
  - Remove content-related browser `fetch` and generated browser OpenAPI content calls.
  - Use `useActionState(saveManagedContentAction, initialState)` for create/update.
  - Use `useRouter()` to select an item by updating `?contentId=`.
  - Sync server-provided `initialItems` and `selectedDetail` into local editable state after server refresh.
- Modify `frontend/src/components/manage-content-client.test.tsx`
  - Mock `next/navigation` router hooks.
  - Mock the content Server Action.
  - Assert no HTTP handlers are needed for content detail or content save.
- Modify `frontend/src/lib/server/content/content-route.ts`
  - Remove published detail GET helper if no remaining route uses it.
  - Remove content create/update helpers after Server Action owns mutations.
  - Keep management list/detail helpers only if Route Handlers remain for compatibility during this refactor; otherwise delete in the route cleanup task.
- Delete or simplify `frontend/src/app/api/content/[id]/route.ts`
  - Remove unused `GET /api/content/[id]`.
  - Remove `PUT /api/content/[id]` after action migration.
- Modify `frontend/src/app/api/content/route.ts`
  - Keep `GET /api/content` only if current feed/client API contract still needs it.
  - Remove `POST /api/content` after action migration.
- Consider deleting `frontend/src/app/api/manage/content/[id]/route.ts`
  - Delete after the management detail read is SSR through `?contentId=`.
- Keep `frontend/src/app/api/manage/content/route.ts` unless a separate audit confirms no browser caller needs it.
  - This plan removes the content management component caller, but admin/user client APIs are out of scope.

## Task 1: Add Server Action Cache Invalidation

**Files:**
- Modify: `frontend/src/lib/server/content/content-cache-invalidation.ts`
- Test: `frontend/src/lib/server/content/content-route.test.ts` or new `frontend/src/lib/server/content/content-cache-invalidation.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/server/content/content-cache-invalidation.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  revalidateContentAfterMutation,
  updateContentAfterMutation,
} from "./content-cache-invalidation";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

import { revalidateTag, updateTag } from "next/cache";

const mockedRevalidateTag = vi.mocked(revalidateTag);
const mockedUpdateTag = vi.mocked(updateTag);

describe("content cache invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps stale-while-revalidate behavior for route handlers", () => {
    revalidateContentAfterMutation(7);

    expect(mockedRevalidateTag).toHaveBeenCalledWith("content", "max");
    expect(mockedRevalidateTag).toHaveBeenCalledWith("content:published", "max");
    expect(mockedRevalidateTag).toHaveBeenCalledWith("content:management", "max");
    expect(mockedRevalidateTag).toHaveBeenCalledWith("content:detail:7", "max");
  });

  it("immediately expires content tags for server actions", () => {
    updateContentAfterMutation(7);

    expect(mockedUpdateTag).toHaveBeenCalledWith("content");
    expect(mockedUpdateTag).toHaveBeenCalledWith("content:published");
    expect(mockedUpdateTag).toHaveBeenCalledWith("content:management");
    expect(mockedUpdateTag).toHaveBeenCalledWith("content:detail:7");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && npm run test:unit -- src/lib/server/content/content-cache-invalidation.test.ts
```

Expected: FAIL because `updateContentAfterMutation` is not exported.

- [ ] **Step 3: Write minimal implementation**

Update `frontend/src/lib/server/content/content-cache-invalidation.ts`:

```ts
import "server-only";

import { revalidateTag, updateTag } from "next/cache";

import {
  CONTENT_CACHE_TAG,
  CONTENT_MANAGEMENT_CACHE_TAG,
  CONTENT_PUBLISHED_CACHE_TAG,
  contentDetailCacheTag,
} from "./cache-tags";

export function revalidateContentAfterMutation(id?: string | number): void {
  revalidateTag(CONTENT_CACHE_TAG, "max");
  revalidateTag(CONTENT_PUBLISHED_CACHE_TAG, "max");
  revalidateTag(CONTENT_MANAGEMENT_CACHE_TAG, "max");

  if (id !== undefined) {
    revalidateTag(contentDetailCacheTag(id), "max");
  }
}

export function updateContentAfterMutation(id?: string | number): void {
  updateTag(CONTENT_CACHE_TAG);
  updateTag(CONTENT_PUBLISHED_CACHE_TAG);
  updateTag(CONTENT_MANAGEMENT_CACHE_TAG);

  if (id !== undefined) {
    updateTag(contentDetailCacheTag(id));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd frontend && npm run test:unit -- src/lib/server/content/content-cache-invalidation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/server/content/content-cache-invalidation.ts frontend/src/lib/server/content/content-cache-invalidation.test.ts
git commit -m "feat: add server action content cache expiry"
```

## Task 2: Add Management Detail DAL For SSR Selection

**Files:**
- Modify: `frontend/src/lib/server/content/content-dal.ts`
- Test: `frontend/src/lib/server/content/content-dal.test.ts`

- [ ] **Step 1: Write the failing tests**

Append these tests inside the existing `describe("content DAL", () => { ... })` block in `frontend/src/lib/server/content/content-dal.test.ts`:

```ts
it("uses the cached management detail when the management token is configured", async () => {
  mockedHasManagementToken.mockReturnValue(true);
  mockedCachedManagedDetail.mockResolvedValue({
    id: 9,
    title: "Draft",
    body: "Manager body",
    category: "security",
    published: false,
  });

  const detail = await getManagedContentDetailForRequest("9");

  expect(detail.title).toBe("Draft");
  expect(mockedCachedManagedDetail).toHaveBeenCalledWith("9");
  expect(mockedFetchProtectedOpenApi).not.toHaveBeenCalled();
});

it("falls back to the session-backed management detail when the management token is missing", async () => {
  mockedHasManagementToken.mockReturnValue(false);
  mockedFetchProtectedOpenApi.mockResolvedValue({
    id: 9,
    title: "Draft",
    body: "Manager body",
    category: "security",
    published: false,
  });

  await getManagedContentDetailForRequest("9");

  expect(mockedCachedManagedDetail).not.toHaveBeenCalled();
  expect(mockedFetchProtectedOpenApi).toHaveBeenCalledOnce();
});
```

Also update imports and mocks in the same test file:

```ts
import {
  getContentDetailForRequest,
  getManagedContentDetailForRequest,
  getManagedContentSummariesForRequest,
  getPublishedContentSummariesForRequest,
} from "./content-dal";
import {
  unsafeGetCachedManagedContentDetailAfterAuthorization,
  unsafeGetCachedManagedContentSummariesAfterAuthorization,
  unsafeGetCachedPublishedContentDetailAfterAuthorization,
  unsafeGetCachedPublishedContentSummariesAfterAuthorization,
} from "./cached-content";
```

Update the `vi.mock("./cached-content", ...)` block:

```ts
vi.mock("./cached-content", () => ({
  unsafeGetCachedManagedContentDetailAfterAuthorization: vi.fn(),
  unsafeGetCachedManagedContentSummariesAfterAuthorization: vi.fn(),
  unsafeGetCachedPublishedContentDetailAfterAuthorization: vi.fn(),
  unsafeGetCachedPublishedContentSummariesAfterAuthorization: vi.fn(),
}));
```

Add the mocked variable after the existing cached mocks:

```ts
const mockedCachedManagedDetail = vi.mocked(
  unsafeGetCachedManagedContentDetailAfterAuthorization,
);
```

Add this default in `beforeEach`:

```ts
mockedCachedManagedDetail.mockResolvedValue({
  id: 9,
  title: "Draft",
  body: "Manager body",
  category: "security",
  published: false,
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && npm run test:unit -- src/lib/server/content/content-dal.test.ts
```

Expected: FAIL because `getManagedContentDetailForRequest` and `unsafeGetCachedManagedContentDetailAfterAuthorization` are not implemented.

- [ ] **Step 3: Add cached management detail helper**

In `frontend/src/lib/server/content/cached-content.ts`, add this export after `unsafeGetCachedManagedContentSummariesAfterAuthorization`:

```ts
export async function unsafeGetCachedManagedContentDetailAfterAuthorization(
  id: string,
): Promise<ContentDetail> {
  "use cache";

  const contentId = Number(id);

  cacheLife(CONTENT_CACHE_LIFE);
  cacheTag(
    CONTENT_CACHE_TAG,
    CONTENT_MANAGEMENT_CACHE_TAG,
    contentDetailCacheTag(contentId),
  );

  return executeOpenApiRequest({
    baseUrl: getApiBaseUrl(),
    tokens: { accessToken: getContentManagementServiceToken() },
    createApi: ({ content }) => content,
    operation: (content) =>
      content.getContent({
        contentId,
        includeAll: true,
      }),
    skipRefresh: true,
  });
}
```

- [ ] **Step 4: Add management detail DAL**

Update imports in `frontend/src/lib/server/content/content-dal.ts`:

```ts
import {
  unsafeGetCachedManagedContentDetailAfterAuthorization,
  unsafeGetCachedManagedContentSummariesAfterAuthorization,
  unsafeGetCachedPublishedContentDetailAfterAuthorization,
  unsafeGetCachedPublishedContentSummariesAfterAuthorization,
} from "./cached-content";
```

Add this function after `getManagedContentSummariesForRequest()`:

```ts
export async function getManagedContentDetailForRequest(
  id: string,
): Promise<ContentDetail> {
  const session = await requireSession("/manage/content");

  if (!canManageContent(session)) {
    forbidden();
  }

  if (!hasContentManagementServiceToken()) {
    return fetchProtectedOpenApi(
      `/manage/content?contentId=${id}`,
      ({ content }) => content,
      (content) =>
        content.getContent({
          contentId: Number(id),
          includeAll: true,
        }),
    );
  }

  return unsafeGetCachedManagedContentDetailAfterAuthorization(id);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
cd frontend && npm run test:unit -- src/lib/server/content/content-dal.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/server/content/cached-content.ts frontend/src/lib/server/content/content-dal.ts frontend/src/lib/server/content/content-dal.test.ts
git commit -m "feat: load managed content detail on the server"
```

## Task 3: Add Content Save Server Action

**Files:**
- Create: `frontend/src/app/actions/content.ts`
- Test: `frontend/src/app/actions/content.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/actions/content.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveManagedContentAction } from "./content";
import { executeOpenApiRequest } from "@/lib/server/openapi-client";
import { requireSession } from "@/lib/server/session";
import { updateContentAfterMutation } from "@/lib/server/content/content-cache-invalidation";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/server/session", () => ({
  getApiBaseUrl: vi.fn(() => "http://localhost:8080"),
  requireSession: vi.fn(),
}));

vi.mock("@/lib/server/openapi-client", () => ({
  BackendRequestError: class BackendRequestError extends Error {
    code: string;
    displayMessage: string;
    status: number;

    constructor(code: string, displayMessage: string, status: number) {
      super(displayMessage);
      this.name = "BackendRequestError";
      this.code = code;
      this.displayMessage = displayMessage;
      this.status = status;
    }
  },
  executeOpenApiRequest: vi.fn(),
}));

vi.mock("@/lib/server/content/content-cache-invalidation", () => ({
  updateContentAfterMutation: vi.fn(),
}));

const mockedRequireSession = vi.mocked(requireSession);
const mockedExecuteOpenApiRequest = vi.mocked(executeOpenApiRequest);
const mockedUpdateContentAfterMutation = vi.mocked(updateContentAfterMutation);

const managerSession = {
  tokens: {
    grantType: "Bearer",
    accessToken: "access-token",
    refreshToken: "refresh-token",
    accessTokenExpiresIn: 600,
    refreshTokenExpiresIn: 86400,
  },
  user: {
    id: 1,
    email: "manager@example.com",
    nickname: "manager",
    roleNames: ["ROLE_MANAGER"],
  },
};

function formData(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

describe("saveManagedContentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRequireSession.mockResolvedValue(managerSession);
    mockedExecuteOpenApiRequest.mockResolvedValue({
      id: 7,
      title: "JWT Refresh",
      body: "Updated body",
      category: "tokens",
      published: true,
    });
  });

  it("creates content and expires content tags", async () => {
    const result = await saveManagedContentAction(
      { status: "idle", message: null, error: null },
      formData({
        title: "JWT Refresh",
        body: "Updated body",
        category: "tokens",
        published: "true",
      }),
    );

    expect(result).toEqual({
      status: "success",
      message: "Content created.",
      error: null,
      contentId: 7,
    });
    expect(mockedUpdateContentAfterMutation).toHaveBeenCalledWith(7);
  });

  it("updates content when id is present", async () => {
    await saveManagedContentAction(
      { status: "idle", message: null, error: null },
      formData({
        id: "7",
        title: "JWT Refresh",
        body: "Updated body",
        category: "tokens",
        published: "false",
      }),
    );

    const options = mockedExecuteOpenApiRequest.mock.calls[0]?.[0];
    const updateContent = vi.fn(async () => ({ id: 7 }));

    await options?.operation({ updateContent } as never);

    expect(updateContent).toHaveBeenCalledWith({
      contentId: 7,
      contentUpsertRequest: {
        title: "JWT Refresh",
        body: "Updated body",
        category: "tokens",
        published: false,
      },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && npm run test:unit -- src/app/actions/content.test.ts
```

Expected: FAIL because `frontend/src/app/actions/content.ts` does not exist.

- [ ] **Step 3: Implement the Server Action**

Create `frontend/src/app/actions/content.ts`:

```ts
"use server";

import { forbidden } from "next/navigation";

import type { ContentUpsertRequest } from "@/generated/openapi/src/models";
import { createDisplayError, type DisplayError } from "@/lib/auth-errors";
import { canManageContent } from "@/lib/server/content/permissions";
import { updateContentAfterMutation } from "@/lib/server/content/content-cache-invalidation";
import {
  BackendRequestError,
  executeOpenApiRequest,
} from "@/lib/server/openapi-client";
import { getApiBaseUrl, requireSession } from "@/lib/server/session";

export type SaveContentFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  error: DisplayError | null;
  contentId?: number;
};

export const initialSaveContentFormState: SaveContentFormState = {
  status: "idle",
  message: null,
  error: null,
};

export async function saveManagedContentAction(
  _previousState: SaveContentFormState,
  formData: FormData,
): Promise<SaveContentFormState> {
  const session = await requireSession("/manage/content");

  if (!canManageContent(session)) {
    forbidden();
  }

  const id = parseOptionalContentId(formData.get("id"));
  const contentUpsertRequest = parseContentUpsertRequest(formData);

  if (!contentUpsertRequest) {
    return {
      status: "error",
      message: null,
      error: createDisplayError("ERROR_BAD_REQUEST", "Content fields are required."),
    };
  }

  try {
    const content = await executeOpenApiRequest({
      baseUrl: getApiBaseUrl(),
      tokens: session.tokens,
      createApi: ({ content }) => content,
      operation: (contentApi) =>
        id == null
          ? contentApi.createContent({ contentUpsertRequest })
          : contentApi.updateContent({
              contentId: id,
              contentUpsertRequest,
            }),
    });

    updateContentAfterMutation(content.id);

    return {
      status: "success",
      message: id == null ? "Content created." : "Content updated.",
      error: null,
      contentId: content.id,
    };
  } catch (error) {
    if (error instanceof BackendRequestError) {
      return {
        status: "error",
        message: null,
        error: {
          code: error.code,
          message: error.displayMessage,
        },
      };
    }

    return {
      status: "error",
      message: null,
      error: createDisplayError("ERROR_CONTENT"),
    };
  }
}

function parseContentUpsertRequest(
  formData: FormData,
): ContentUpsertRequest | null {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const published = formData.get("published") === "true";

  if (!title || !body || !category) {
    return null;
  }

  return {
    title,
    body,
    category,
    published,
  };
}

function parseOptionalContentId(value: FormDataEntryValue | null): number | null {
  if (value == null || value === "") {
    return null;
  }

  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd frontend && npm run test:unit -- src/app/actions/content.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/actions/content.ts frontend/src/app/actions/content.test.ts
git commit -m "feat: save content with server actions"
```

## Task 4: Server Render Selected Management Detail

**Files:**
- Modify: `frontend/src/app/(auth)/manage/content/page.tsx`
- Test: no direct async Server Component test; covered by DAL tests and browser verification.

- [ ] **Step 1: Replace page data flow**

Update `frontend/src/app/(auth)/manage/content/page.tsx`:

```tsx
import { Suspense } from "react";

import { GuardPanel } from "@/components/guard-panel";
import { ManageContentClient } from "@/components/manage-content-client";
import {
  getManagedContentDetailForRequest,
  getManagedContentSummariesForRequest,
} from "@/lib/server/content/content-dal";

export default function ManageContentPage({
  searchParams,
}: PageProps<"/manage/content">) {
  return (
    <Suspense
      fallback={
        <GuardPanel
          eyebrow="Manager Surface"
          title="Loading content workspace..."
          body="Preparing the protected content management tools for privileged roles."
        />
      }
    >
      <ManageContentWorkspace searchParams={searchParams} />
    </Suspense>
  );
}

async function ManageContentWorkspace({
  searchParams,
}: {
  searchParams: PageProps<"/manage/content">["searchParams"];
}) {
  const resolvedSearchParams = await searchParams;
  const rawContentId = resolvedSearchParams.contentId;
  const selectedContentId = Array.isArray(rawContentId)
    ? rawContentId[0]
    : rawContentId;

  const [items, selectedDetail] = await Promise.all([
    getManagedContentSummariesForRequest(),
    selectedContentId
      ? getManagedContentDetailForRequest(selectedContentId)
      : Promise.resolve(null),
  ]);

  return (
    <ManageContentClient
      initialItems={items}
      selectedDetail={selectedDetail}
    />
  );
}
```

- [ ] **Step 2: Run TypeScript build check for page signature**

Run:

```bash
cd frontend && npm run build
```

Expected: PASS, or FAIL only if the generated `PageProps<"/manage/content">` shape differs. If it fails on `searchParams`, inspect `.next/types` or existing generated route type examples and adjust the type only; do not change the runtime behavior.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/'(auth)'/manage/content/page.tsx
git commit -m "feat: server render selected managed content"
```

## Task 5: Refactor ManageContentClient Away From Browser Content API Calls

**Files:**
- Modify: `frontend/src/components/manage-content-client.tsx`
- Test: `frontend/src/components/manage-content-client.test.tsx`

- [ ] **Step 1: Write failing component tests**

Replace HTTP-backed save/detail expectations in `frontend/src/components/manage-content-client.test.tsx` with Server Action and router expectations. At the top of the test file, add:

```ts
import { saveManagedContentAction } from "@/app/actions/content";
import { useRouter, useSearchParams } from "next/navigation";

vi.mock("@/app/actions/content", () => ({
  initialSaveContentFormState: {
    status: "idle",
    message: null,
    error: null,
  },
  saveManagedContentAction: vi.fn(async () => ({
    status: "success",
    message: "Content created.",
    error: null,
    contentId: 2,
  })),
}));

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace, refresh })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
```

Add this `beforeEach` inside `describe("ManageContentClient", ...)`:

```ts
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRouter).mockReturnValue({ replace, refresh } as never);
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as never);
  vi.mocked(saveManagedContentAction).mockResolvedValue({
    status: "success",
    message: "Content created.",
    error: null,
    contentId: 2,
  });
});
```

Replace the detail-loading test body with:

```ts
it("loads selected content details from server props", () => {
  render(
    <ManageContentClient
      initialItems={[
        {
          id: 1,
          title: "JWT Basics",
          category: "security",
          published: true,
        },
      ]}
      selectedDetail={{
        id: 1,
        title: "JWT Basics",
        body: "Understand the filter chain before token parsing.",
        category: "security",
        published: false,
      }}
    />,
  );

  expect(screen.getByDisplayValue("JWT Basics")).toBeInTheDocument();
  expect(
    screen.getByDisplayValue("Understand the filter chain before token parsing."),
  ).toBeInTheDocument();
  expect(screen.getByDisplayValue("security")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Update content" })).toBeEnabled();
});
```

Add a route-selection test:

```ts
it("selects content by updating the server-rendered query string", async () => {
  const user = userEvent.setup();

  render(
    <ManageContentClient
      initialItems={[
        {
          id: 1,
          title: "JWT Basics",
          category: "security",
          published: true,
        },
      ]}
      selectedDetail={null}
    />,
  );

  await user.click(screen.getByRole("button", { name: /jwt basics/i }));

  expect(replace).toHaveBeenCalledWith("/manage/content?contentId=1");
});
```

Replace save tests so they assert the mocked Server Action result is reflected and `refresh` is called. Do not register `http.post("/api/content")`, `http.put("/api/content/:id")`, or `http.get("/api/manage/content/:id")` handlers in these tests anymore.

- [ ] **Step 2: Run component test to verify it fails**

Run:

```bash
cd frontend && npm run test:components -- src/components/manage-content-client.test.tsx
```

Expected: FAIL because `ManageContentClient` still requires only `initialItems` and still calls browser fetch/OpenAPI helpers.

- [ ] **Step 3: Implement client refactor**

Update the top imports in `frontend/src/components/manage-content-client.tsx`:

```tsx
"use client";

import {
  initialSaveContentFormState,
  saveManagedContentAction,
} from "@/app/actions/content";
import { DossierRail, DossierSection, DossierSurface } from "@/components/dossier";
import type { ContentDetail, ContentSummary } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type FormEvent,
  startTransition,
  useActionState,
  useEffect,
  useId,
  useState,
} from "react";
```

Change component props and setup:

```tsx
export function ManageContentClient({
  initialItems,
  selectedDetail,
}: {
  initialItems: ContentSummary[];
  selectedDetail: ContentDetail | null;
}) {
  const editorFieldPrefix = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saveState, formAction, saving] = useActionState(
    saveManagedContentAction,
    initialSaveContentFormState,
  );
  const [items, setItems] = useState(initialItems);
  const [editor, setEditor] = useState<EditorState>(
    selectedDetail ? toEditorState(selectedDetail) : EMPTY_EDITOR,
  );

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (selectedDetail) {
      setEditor(toEditorState(selectedDetail));
    }
  }, [selectedDetail]);

  useEffect(() => {
    if (saveState.status === "success") {
      setEditor(EMPTY_EDITOR);
      router.refresh();
    }
  }, [router, saveState]);
```

Replace `selectContent` with URL state:

```tsx
  function selectContent(contentId: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("contentId", String(contentId));
    router.replace(`/manage/content?${params.toString()}`);
  }
```

Replace `handleSubmit` with form action dispatch:

```tsx
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      formAction(formData);
    });
  }
```

Inside the `<form>`, add hidden fields before visible fields:

```tsx
<input type="hidden" name="id" value={editor.id ?? ""} />
<input
  type="hidden"
  name="published"
  value={editor.published ? "true" : "false"}
/>
```

Ensure visible controls have these names:

```tsx
<input name="title" ... />
<input name="category" ... />
<textarea name="body" ... />
```

Replace message/error rendering with `saveState`:

```tsx
{saveState.message ? (
  <p className="text-sm font-medium text-[color:var(--success)]">
    {saveState.message}
  </p>
) : null}
{saveState.error ? (
  <div className="text-sm text-[color:var(--warn)]">
    <p className="font-semibold">{saveState.error.code}</p>
    <p className="mt-1">{saveState.error.message}</p>
  </div>
) : null}
```

Remove these functions entirely:

```ts
async function fetchManagedContentSummaries(): Promise<ContentSummary[]>;
async function fetchManagedContentDetail(id: number): Promise<ContentDetail>;
async function fetchManagedContent<T>(path: string): Promise<T>;
async function extractManagedContentError(response: Response): Promise<never>;
function toContentError(error: unknown);
```

Add helper at the bottom:

```ts
function toEditorState(detail: ContentDetail): EditorState {
  return {
    id: detail.id,
    title: detail.title,
    body: detail.body,
    category: detail.category,
    published: detail.published,
  };
}
```

- [ ] **Step 4: Run component test to verify it passes**

Run:

```bash
cd frontend && npm run test:components -- src/components/manage-content-client.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/manage-content-client.tsx frontend/src/components/manage-content-client.test.tsx
git commit -m "refactor: move content editor reads to server render"
```

## Task 6: Remove Redundant Content Route Handlers

**Files:**
- Modify or delete: `frontend/src/app/api/content/[id]/route.ts`
- Modify: `frontend/src/app/api/content/route.ts`
- Delete: `frontend/src/app/api/manage/content/[id]/route.ts`
- Modify: `frontend/src/lib/server/content/content-route.ts`
- Modify: `frontend/src/lib/server/content/content-route.test.ts`
- Modify: `frontend/src/components/content-feed-view.tsx`

- [ ] **Step 1: Confirm no source callers remain**

Run:

```bash
cd frontend && rg -n "/api/content/|/api/manage/content/|createManagedContentResponse|updateManagedContentResponse|getPublishedContentDetailResponse|getManagedContentDetailResponse" src --glob '!generated/**'
```

Expected before cleanup: matches in route files, route tests, and possibly copy text. Expected after cleanup: no matches for deleted helpers/routes, and no component browser fetches for content detail/save.

- [ ] **Step 2: Update route helper test expectations**

Edit `frontend/src/lib/server/content/content-route.test.ts` so it only imports and tests helpers still used by remaining Route Handlers. If only `GET /api/content` and `GET /api/manage/content` remain, keep:

```ts
import {
  getManagedContentSummariesResponse,
  getPublishedContentSummariesResponse,
} from "./content-route";
```

Remove tests for:

```ts
getPublishedContentDetailResponse
getManagedContentDetailResponse
createManagedContentResponse
updateManagedContentResponse
```

Keep tests proving:

```ts
it("keeps published list requests from forwarding includeAll", async () => {
  await getPublishedContentSummariesResponse();
  const options = mockedExecuteRouteOpenApiRequest.mock.calls[0]?.[0];
  const getContents = vi.fn(async () => []);

  await options?.operation(
    { getContents } as unknown as BackendOpenApiClients["content"],
    undefined,
  );

  expect(getContents).toHaveBeenCalledWith({});
});

it("uses explicit management routes for includeAll list reads", async () => {
  await getManagedContentSummariesResponse();
  const options = mockedExecuteRouteOpenApiRequest.mock.calls[0]?.[0];
  const getContents = vi.fn(async () => []);

  await options?.operation(
    { getContents } as unknown as BackendOpenApiClients["content"],
    undefined,
  );

  expect(options?.requiredRoles).toEqual(["ROLE_MANAGER", "ROLE_ADMIN"]);
  expect(getContents).toHaveBeenCalledWith({ includeAll: true });
});
```

- [ ] **Step 3: Simplify route helper implementation**

Update `frontend/src/lib/server/content/content-route.ts` to:

```ts
import "server-only";

import { executeRouteOpenApiRequest } from "../openapi-route";

const CONTENT_MANAGER_ROLES = ["ROLE_MANAGER", "ROLE_ADMIN"];

export function getPublishedContentSummariesResponse() {
  return executeRouteOpenApiRequest({
    createApi: ({ content }) => content,
    operation: (content) => content.getContents({}),
  });
}

export function getManagedContentSummariesResponse() {
  return executeRouteOpenApiRequest({
    createApi: ({ content }) => content,
    operation: (content) => content.getContents({ includeAll: true }),
    requiredRoles: CONTENT_MANAGER_ROLES,
  });
}
```

- [ ] **Step 4: Delete or simplify route files**

Delete `frontend/src/app/api/content/[id]/route.ts`.

Delete `frontend/src/app/api/manage/content/[id]/route.ts`.

Update `frontend/src/app/api/content/route.ts` to only expose `GET`:

```ts
import { getPublishedContentSummariesResponse } from "@/lib/server/content/content-route";

export async function GET() {
  return getPublishedContentSummariesResponse();
}
```

Keep `frontend/src/app/api/manage/content/route.ts` as:

```ts
import { getManagedContentSummariesResponse } from "@/lib/server/content/content-route";

export async function GET() {
  return getManagedContentSummariesResponse();
}
```

- [ ] **Step 5: Update stale UI copy**

In `frontend/src/components/content-feed-view.tsx`, replace API-route-specific text:

```tsx
intro="This subscriber-only feed is loaded through the JWT-protected GET /api/content endpoint. Each entry stays lightweight so the view reads like a protected document index rather than a gallery."
```

with server-render wording:

```tsx
intro="This subscriber-only feed is loaded on the server through the JWT-protected content boundary. Each entry stays lightweight so the view reads like a protected document index rather than a gallery."
```

- [ ] **Step 6: Run route helper tests**

Run:

```bash
cd frontend && npm run test:unit -- src/lib/server/content/content-route.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run source audit again**

Run:

```bash
cd frontend && rg -n "/api/content/|/api/manage/content/|createManagedContentResponse|updateManagedContentResponse|getPublishedContentDetailResponse|getManagedContentDetailResponse" src --glob '!generated/**'
```

Expected: no matches except generated OpenAPI code or intentionally retained list endpoints.

- [ ] **Step 8: Commit**

```bash
git add -A frontend/src/app/api/content frontend/src/app/api/manage/content frontend/src/lib/server/content/content-route.ts frontend/src/lib/server/content/content-route.test.ts frontend/src/components/content-feed-view.tsx
git commit -m "refactor: remove redundant content route handlers"
```

## Task 7: Full Verification With next-browser

**Files:**
- No source edits unless verification finds a bug.

- [ ] **Step 1: Run static checks**

Run:

```bash
cd frontend && npm run lint
```

Expected: PASS.

Run:

```bash
cd frontend && npm run test:unit
```

Expected: PASS.

Run:

```bash
cd frontend && npm run test:components
```

Expected: PASS.

Run:

```bash
cd frontend && npm run build
```

Expected: PASS.

- [ ] **Step 2: Prepare next-browser**

Run:

```bash
next-browser --version
npm view @vercel/next-browser version
```

Expected: installed version is equal to the npm latest. If installed version is older, run:

```bash
npm install -g @vercel/next-browser@latest
playwright install chromium
```

- [ ] **Step 3: Start the frontend dev server**

Run:

```bash
cd frontend && npm run dev
```

Expected: dev server starts and prints a local URL, usually `http://localhost:3000`.

- [ ] **Step 4: Open authenticated management page**

If the page requires login, ask the user for a cookie file path only. Tell them exactly:

```text
Open DevTools → Network, click any authenticated request, right-click → Copy → Copy as cURL, paste the whole thing into a file, and give me the path.
```

Then run:

```bash
next-browser open http://localhost:3000/manage/content --cookies /path/from/user.curl
next-browser screenshot "Manage content initial server render"
```

Expected: content management page renders without runtime errors.

- [ ] **Step 5: Verify selection uses server navigation instead of browser API fetch**

Run:

```bash
next-browser network
next-browser snapshot
```

Click a content item using the ref from `snapshot`:

```bash
next-browser click eN
next-browser screenshot "Managed content selected through server render"
next-browser network
```

Expected: URL becomes `/manage/content?contentId=<id>`. Network should show Next navigation/RSC traffic, not `GET /api/manage/content/<id>`.

- [ ] **Step 6: Verify mutation uses Server Action and cache refresh**

Fill the form and submit using refs from `snapshot`:

```bash
next-browser snapshot
next-browser fill eTitle "JWT Cache Boundary"
next-browser fill eCategory "security"
next-browser fill eBody "Server Actions expire content tags after the backend mutation."
next-browser click eSubmit
next-browser screenshot "Managed content saved through server action"
next-browser network
```

Expected: network output includes a POST with `next-action=...`, not `POST /api/content` or `PUT /api/content/<id>`. The list refreshes with the saved title.

- [ ] **Step 7: Check runtime errors**

Run:

```bash
next-browser errors
next-browser browser-logs
```

Expected: no Next.js runtime errors and no browser console errors caused by the refactor.

- [ ] **Step 8: Commit verification fixes if needed**

If verification required fixes, run focused tests again, then commit:

```bash
git add frontend
git commit -m "fix: verify content server action cache flow"
```

If no fixes were required, do not create an empty commit.

## Self-Review

- Spec coverage: The plan removes content client-side detail fetches by moving selection into server-rendered URL state, moves create/update mutations to a Server Action, and uses Next 16 `updateTag` for read-your-own-writes cache expiry. It preserves existing server cached reads and Suspense boundaries.
- Route scope: The plan removes redundant `content/:id` and management detail API routes, but keeps list endpoints unless source audit proves they are unused. This avoids breaking unrelated clients outside the current content refactor.
- Placeholder scan: No step depends on unspecified implementation details; code snippets define new functions, tests, imports, and commands.
- Type consistency: `ContentDetail`, `ContentSummary`, `ContentUpsertRequest`, `SaveContentFormState`, `saveManagedContentAction`, `updateContentAfterMutation`, and `getManagedContentDetailForRequest` are introduced before later tasks depend on them.
