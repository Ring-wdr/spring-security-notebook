import { proxyJsonRequest } from "@/lib/server/proxy-json";

export async function GET() {
  return proxyJsonRequest("/api/admin/users");
}
