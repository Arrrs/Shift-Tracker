import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
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

export default nextConfig;
