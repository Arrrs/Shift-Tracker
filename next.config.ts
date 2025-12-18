import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
});

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Add empty turbopack config to silence warning
  turbopack: {},
  experimental: {
    serverActions: {
      allowedOrigins:
        process.env.NODE_ENV === "development"
          ? [
              "localhost:3000",
              "f62r3d54-3000.euw.devtunnels.ms",
            ]
          : [], // Production: strict origin checking
    },
  },
};

export default withPWA(nextConfig);
