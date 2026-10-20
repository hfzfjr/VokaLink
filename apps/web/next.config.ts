import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@vokalink/shared", "@vokalink/core"],
};

export default nextConfig;
