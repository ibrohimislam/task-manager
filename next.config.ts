import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: process.env.BASE_PATH || undefined,
};

export default nextConfig;
