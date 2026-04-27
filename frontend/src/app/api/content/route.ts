import { proxyJsonRequest } from "@/lib/server/proxy-json";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyJsonRequest(`/api/content${url.search}`);
}

export async function POST(request: Request) {
  return proxyJsonRequest("/api/content", {
    method: "POST",
    body: await request.text(),
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
  });
}
