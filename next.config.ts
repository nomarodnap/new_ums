import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
      allowedOrigins: ["ums.fisheries.go.th", "localhost:3000", "localhost:3002"],
    },
  },
};

export default nextConfig;
