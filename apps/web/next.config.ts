import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: isDev,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@vokalink/shared", "@vokalink/core"],
  turbopack: {
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@vokalink/shared", "@vokalink/core"],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  // @vokalink/core/crypto uses node:crypto — keep it server-side only
  serverExternalPackages: [],
  ...(isDev
    ? {}
    : {
        webpack: (config) => {
          config.resolve.extensionAlias = {
            ".js": [".ts", ".tsx", ".js"],
            ".mjs": [".mts", ".mjs"],
            ".cjs": [".cts", ".cjs"],
          };
          return config;
        },
      }),
};

export default isDev ? nextConfig : withSerwist(nextConfig);
