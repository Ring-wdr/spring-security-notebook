import { revalidateTag } from "next/cache";

import { CONTENT_CACHE_TAG } from "@/lib/server/content-cache";
import { proxyJsonRequest } from "@/lib/server/proxy-json";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyJsonRequest(`/api/content${url.search}`);
}

export async function POST(request: Request) {
  const response = await proxyJsonRequest("/api/content", {
    method: "POST",
    body: await request.text(),
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
  });

  if (response.ok) {
    revalidateTag(CONTENT_CACHE_TAG, "max");
  }

  return response;
}
