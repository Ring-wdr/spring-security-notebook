import { proxyJsonRequest } from "@/lib/server/proxy-json";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ email: string }> },
) {
  const { email } = await context.params;
  return proxyJsonRequest(`/api/admin/users/${encodeURIComponent(email)}/role`, {
    method: "PATCH",
    body: await request.text(),
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
  });
}
