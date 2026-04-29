import { revalidateTag } from "next/cache";

import {
  CONTENT_CACHE_TAG,
  CONTENT_DETAIL_CACHE_TAG_PREFIX,
} from "@/lib/server/content-cache";
import { proxyJsonRequest } from "@/lib/server/proxy-json";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  return proxyJsonRequest(`/api/content/${id}${url.search}`);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const response = await proxyJsonRequest(`/api/content/${id}`, {
    method: "PUT",
    body: await request.text(),
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
  });

  if (response.ok) {
    revalidateTag(CONTENT_CACHE_TAG, "max");
    revalidateTag(`${CONTENT_DETAIL_CACHE_TAG_PREFIX}:${id}`, "max");
  }

  return response;
}
