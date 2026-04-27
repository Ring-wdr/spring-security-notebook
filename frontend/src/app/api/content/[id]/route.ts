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
  return proxyJsonRequest(`/api/content/${id}`, {
    method: "PUT",
    body: await request.text(),
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
  });
}
