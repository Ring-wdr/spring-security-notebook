import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  typedRoutes: true,
  experimental: {
    authInterrupts: true,
  },
  reactCompiler: true,
};

export default nextConfig;
