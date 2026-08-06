import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "fatni-photography.vercel.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.vercel.app",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
