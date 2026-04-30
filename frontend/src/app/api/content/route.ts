import { getPublishedContentSummariesResponse } from "@/lib/server/content/content-route";

export async function GET() {
  return getPublishedContentSummariesResponse();
}
