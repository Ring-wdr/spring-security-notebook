import "server-only";

import { executeRouteOpenApiRequest } from "../openapi-route";

const CONTENT_MANAGER_ROLES = ["ROLE_MANAGER", "ROLE_ADMIN"];

export function getPublishedContentSummariesResponse() {
  return executeRouteOpenApiRequest({
    createApi: ({ content }) => content,
    operation: (content) => content.getContents({}),
  });
}

export function getManagedContentSummariesResponse() {
  return executeRouteOpenApiRequest({
    createApi: ({ content }) => content,
    operation: (content) => content.getContents({ includeAll: true }),
    requiredRoles: CONTENT_MANAGER_ROLES,
  });
}
