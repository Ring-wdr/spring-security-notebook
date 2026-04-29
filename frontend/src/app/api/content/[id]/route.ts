import type { ContentUpsertRequest } from "@/generated/openapi/src/models";

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
  return executeRouteOpenApiRequest({
    createApi: ({ content }) => content,
    parseBody: (request) => request.json() as Promise<ContentUpsertRequest>,
    request,
    operation: (content, contentUpsertRequest) =>
      content.updateContent({
        contentId: Number(id),
        contentUpsertRequest,
      }),
  });
}
