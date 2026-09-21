import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Workspace root IS the project root here (no monorepo parent needed).
    root: __dirname,
  },
};

export default nextConfig;