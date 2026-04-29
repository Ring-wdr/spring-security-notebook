import "server-only";

function requireServerEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for cached content access`);
  }

  return value;
}

function hasServerEnv(name: string): boolean {
  return Boolean(process.env[name]);
}

export function getContentPublishedServiceToken(): string {
  return requireServerEnv("CONTENT_PUBLISHED_SERVICE_TOKEN");
}

export function getContentManagementServiceToken(): string {
  return requireServerEnv("CONTENT_MANAGEMENT_SERVICE_TOKEN");
}

export function hasContentPublishedServiceToken(): boolean {
  return hasServerEnv("CONTENT_PUBLISHED_SERVICE_TOKEN");
}

export function hasContentManagementServiceToken(): boolean {
  return hasServerEnv("CONTENT_MANAGEMENT_SERVICE_TOKEN");
}
