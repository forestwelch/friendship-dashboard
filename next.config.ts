import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Prevent Console Ninja extension from injecting code
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Block Console Ninja injection
        "@console-ninja": false,
      };
    }
    return config;
  },
  // Add empty turbopack config to silence warning when using webpack config
  // The webpack config is needed to block Console Ninja extension
  turbopack: {},
};

export default nextConfig;
