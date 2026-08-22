import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "64mb",
    serverActions: {
      bodySizeLimit: "64mb",
    },
  },
  images: {
    // Photographs are already sized under public/images. Serving them
    // through Vercel's optimizer burns the Hobby transform quota.
    unoptimized: true,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.fatniphotography.com",
        pathname: "/**",
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
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "fatni-photography.vercel.app" }],
        destination: "https://www.fatniphotography.com/",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "fatni-photography.vercel.app" }],
        destination: "https://www.fatniphotography.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
