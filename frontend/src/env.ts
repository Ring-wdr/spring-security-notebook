import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const serviceTokenSchema = z
  .string()
  .min(32, "Service tokens must be at least 32 characters when configured")
  .optional();

export const env = createEnv({
  server: {
    CONTENT_PUBLISHED_SERVICE_TOKEN: serviceTokenSchema,
    CONTENT_MANAGEMENT_SERVICE_TOKEN: serviceTokenSchema,
  },
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.url(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  emptyStringAsUndefined: true,
});
