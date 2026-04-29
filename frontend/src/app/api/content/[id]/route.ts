import { revalidateTag } from "next/cache";
import type { ContentUpsertRequest } from "@/generated/openapi/src/models";

import {
  CONTENT_CACHE_TAG,
  CONTENT_DETAIL_CACHE_TAG_PREFIX,
} from "@/lib/server/content-cache";
import { executeRouteOpenApiRequest } from "@/lib/server/openapi-route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  return executeRouteOpenApiRequest({
    createApi: ({ content }) => content,
    operation: (content) =>
      content.getContent({
        contentId: Number(id),
        includeAll: url.searchParams.get("includeAll") === "true" || undefined,
      }),
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const contentUpsertRequest = (await request.json()) as ContentUpsertRequest;
  const response = await executeRouteOpenApiRequest({
    createApi: ({ content }) => content,
    operation: (content) =>
      content.updateContent({
        contentId: Number(id),
        contentUpsertRequest,
      }),
  });

  if (response.ok) {
    revalidateTag(CONTENT_CACHE_TAG, "max");
    revalidateTag(`${CONTENT_DETAIL_CACHE_TAG_PREFIX}:${id}`, "max");
  }

  return response;
}
