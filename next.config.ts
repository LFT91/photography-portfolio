import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
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
