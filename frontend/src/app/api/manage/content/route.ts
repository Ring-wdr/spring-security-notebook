import { getManagedContentSummariesResponse } from "@/lib/server/content/content-route";

export async function GET() {
  return getManagedContentSummariesResponse();
}
