import {
  getPublishedContentDetailResponse,
  updateManagedContentResponse,
} from "@/lib/server/content/content-route";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/content/[id]">,
) {
  const { id } = await context.params;
  return getPublishedContentDetailResponse(id);
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/content/[id]">,
) {
  const { id } = await context.params;
  return updateManagedContentResponse(id, request);
}
