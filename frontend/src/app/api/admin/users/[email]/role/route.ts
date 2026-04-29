import type { UpdateSubscriberRolesRequest } from "@/generated/openapi/src/models";

import { executeRouteOpenApiRequest } from "@/lib/server/openapi-route";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/users/[email]/role">,
) {
  const { email } = await context.params;
  return executeRouteOpenApiRequest({
    createApi: ({ adminSubscribers }) => adminSubscribers,
    parseBody: (request) =>
      request.json() as Promise<UpdateSubscriberRolesRequest>,
    request,
    operation: (adminSubscribers, updateSubscriberRolesRequest) =>
      adminSubscribers.updateRoles({
        email,
        updateSubscriberRolesRequest,
      }),
  });
}
