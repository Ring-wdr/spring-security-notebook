import { revalidateTag } from "next/cache";
import type { ContentUpsertRequest } from "@/generated/openapi/src/models";

import { CONTENT_CACHE_TAG } from "@/lib/server/content-cache";
import { executeRouteOpenApiRequest } from "@/lib/server/openapi-route";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return executeRouteOpenApiRequest({
    createApi: ({ content }) => content,
    operation: (content) =>
      content.getContents({
        includeAll: url.searchParams.get("includeAll") === "true" || undefined,
      }),
  });
}

export async function POST(request: Request) {
  const contentUpsertRequest = (await request.json()) as ContentUpsertRequest;
  const response = await executeRouteOpenApiRequest({
    createApi: ({ content }) => content,
    operation: (content) =>
      content.createContent({
        contentUpsertRequest,
      }),
  });

  if (response.ok) {
    revalidateTag(CONTENT_CACHE_TAG, "max");
  }

  return response;
}
