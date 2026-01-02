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
};

export default nextConfig;
