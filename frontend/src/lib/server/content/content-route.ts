import "server-only";

import type {
  ContentDetailResponse,
  ContentUpsertRequest,
} from "@/generated/openapi/src/models";

import { executeRouteOpenApiRequest } from "../openapi-route";
import type { BackendOpenApiClients } from "../openapi-client";
import { revalidateContentAfterMutation } from "./content-cache-invalidation";

const CONTENT_MANAGER_ROLES = ["ROLE_MANAGER", "ROLE_ADMIN"];

export function getPublishedContentSummariesResponse() {
  return executeRouteOpenApiRequest({
    createApi: ({ content }) => content,
    operation: (content) => content.getContents({}),
  });
}

export function getPublishedContentDetailResponse(id: string) {
  return executeRouteOpenApiRequest({
    createApi: ({ content }) => content,
    operation: (content) =>
      content.getContent({
        contentId: Number(id),
      }),
  });
}

export function getManagedContentSummariesResponse() {
  return executeRouteOpenApiRequest({
    createApi: ({ content }) => content,
    operation: (content) => content.getContents({ includeAll: true }),
    requiredRoles: CONTENT_MANAGER_ROLES,
  });
}

export function getManagedContentDetailResponse(id: string) {
  return executeRouteOpenApiRequest({
    createApi: ({ content }) => content,
    operation: (content) =>
      content.getContent({
        contentId: Number(id),
        includeAll: true,
      }),
    requiredRoles: CONTENT_MANAGER_ROLES,
  });
}

export function createManagedContentResponse(request: Request) {
  return executeRouteOpenApiRequest<
    BackendOpenApiClients["content"],
    ContentDetailResponse,
    ContentUpsertRequest
  >({
    createApi: ({ content }) => content,
    onSuccess: (contentDetail) => {
      revalidateContentAfterMutation(contentDetail.id);
    },
    operation: (content, contentUpsertRequest) =>
      content.createContent({
        contentUpsertRequest,
      }),
    parseBody: parseContentUpsertRequest,
    request,
    requiredRoles: CONTENT_MANAGER_ROLES,
  });
}

export function updateManagedContentResponse(id: string, request: Request) {
  return executeRouteOpenApiRequest<
    BackendOpenApiClients["content"],
    ContentDetailResponse,
    ContentUpsertRequest
  >({
    createApi: ({ content }) => content,
    onSuccess: (contentDetail) => {
      revalidateContentAfterMutation(contentDetail.id);
    },
    operation: (content, contentUpsertRequest) =>
      content.updateContent({
        contentId: Number(id),
        contentUpsertRequest,
      }),
    parseBody: parseContentUpsertRequest,
    request,
    requiredRoles: CONTENT_MANAGER_ROLES,
  });
}

function parseContentUpsertRequest(
  request: Request,
): Promise<ContentUpsertRequest> {
  return request.json() as Promise<ContentUpsertRequest>;
}
