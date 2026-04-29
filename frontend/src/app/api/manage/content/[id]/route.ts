import { getManagedContentDetailResponse } from "@/lib/server/content/content-route";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/manage/content/[id]">,
) {
  const { id } = await context.params;
  return getManagedContentDetailResponse(id);
}
