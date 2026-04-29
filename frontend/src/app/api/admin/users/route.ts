import { executeRouteOpenApiRequest } from "@/lib/server/openapi-route";

export async function GET() {
  return executeRouteOpenApiRequest({
    createApi: ({ adminSubscribers }) => adminSubscribers,
    operation: (adminSubscribers) => adminSubscribers.getSubscribers(),
  });
}
