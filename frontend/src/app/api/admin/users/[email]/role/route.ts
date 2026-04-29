import type { UpdateSubscriberRolesRequest } from "@/generated/openapi/src/models";

import { executeRouteOpenApiRequest } from "@/lib/server/openapi-route";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ email: string }> },
) {
  const { email } = await context.params;
  const updateSubscriberRolesRequest =
    (await request.json()) as UpdateSubscriberRolesRequest;

  return executeRouteOpenApiRequest({
    createApi: ({ adminSubscribers }) => adminSubscribers,
    operation: (adminSubscribers) =>
      adminSubscribers.updateRoles({
        email,
        updateSubscriberRolesRequest,
      }),
  });
}
