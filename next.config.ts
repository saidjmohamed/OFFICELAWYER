import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // FIX 30: Enable React strict mode
  reactStrictMode: true,
};

export default nextConfig;
