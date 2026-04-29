import "server-only";

import { env } from "@/env";

type ContentServiceTokenName =
  | "CONTENT_PUBLISHED_SERVICE_TOKEN"
  | "CONTENT_MANAGEMENT_SERVICE_TOKEN";

function requireContentServiceToken(name: ContentServiceTokenName): string {
  const value = env[name];
  if (!value) {
    throw new Error(`${name} is required for cached content access`);
  }

  return value;
}

function hasContentServiceToken(name: ContentServiceTokenName): boolean {
  return Boolean(env[name]);
}

export function getContentPublishedServiceToken(): string {
  return requireContentServiceToken("CONTENT_PUBLISHED_SERVICE_TOKEN");
}

export function getContentManagementServiceToken(): string {
  return requireContentServiceToken("CONTENT_MANAGEMENT_SERVICE_TOKEN");
}

export function hasContentPublishedServiceToken(): boolean {
  return hasContentServiceToken("CONTENT_PUBLISHED_SERVICE_TOKEN");
}

export function hasContentManagementServiceToken(): boolean {
  return hasContentServiceToken("CONTENT_MANAGEMENT_SERVICE_TOKEN");
}
