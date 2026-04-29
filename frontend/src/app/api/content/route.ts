import {
  createManagedContentResponse,
  getPublishedContentSummariesResponse,
} from "@/lib/server/content/content-route";

export async function GET() {
  return getPublishedContentSummariesResponse();
}

export async function POST(request: Request) {
  return createManagedContentResponse(request);
}
