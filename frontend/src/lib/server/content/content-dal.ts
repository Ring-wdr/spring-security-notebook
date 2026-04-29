import "server-only";

import { forbidden } from "next/navigation";

import type { ContentDetail, ContentSummary } from "@/lib/types";

import { fetchProtectedOpenApi, requireSession } from "../session";
import { canManageContent } from "./permissions";

export async function getPublishedContentSummariesForRequest(
  returnTo: string,
): Promise<ContentSummary[]> {
  await requireSession(returnTo);

  return fetchProtectedOpenApi(
    returnTo,
    ({ content }) => content,
    (content) => content.getContents({}),
  );
}

export async function getContentDetailForRequest(
  id: string,
  returnTo: string,
): Promise<ContentDetail> {
  await requireSession(returnTo);

  return fetchProtectedOpenApi(
    returnTo,
    ({ content }) => content,
    (content) =>
      content.getContent({
        contentId: Number(id),
      }),
  );
}

export async function getManagedContentSummariesForRequest(): Promise<
  ContentSummary[]
> {
  const session = await requireSession("/manage/content");

  if (!canManageContent(session)) {
    forbidden();
  }

  return fetchProtectedOpenApi(
    "/manage/content",
    ({ content }) => content,
    (content) => content.getContents({ includeAll: true }),
  );
}
