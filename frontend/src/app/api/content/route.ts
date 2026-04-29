import type { ContentUpsertRequest } from "@/generated/openapi/src/models";

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
  return executeRouteOpenApiRequest({
    createApi: ({ content }) => content,
    operation: (content) =>
      content.createContent({
        contentUpsertRequest,
      }),
  });
}
