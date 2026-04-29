import { getManagedContentDetailResponse } from "@/lib/server/content/content-route";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return getManagedContentDetailResponse(id);
}
