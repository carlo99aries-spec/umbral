import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the tracing root to this package. Without it, Next walks up and finds
  // an unrelated lockfile in the parent workspace.
  outputFileTracingRoot: path.resolve(process.cwd()),
};

export default nextConfig;
