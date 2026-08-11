import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Photos are already web-sized JPEGs on Supabase / public/. Serving them
    // through Vercel's optimizer burns the Hobby transform quota; new source
    // images then 402 and show as broken "?" thumbs until the cycle resets.
    unoptimized: true,
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
