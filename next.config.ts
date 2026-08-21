import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Derivatives are pre-sized (scripts/generate-images.mjs) or rewritten
    // through Supabase Storage transforms. Vercel image optimization stays
    // off so Hobby transform quota is not consumed.
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
    // Production Vercel alias only — preview hosts are git-sha / branch URLs
    // and are not matched. The Ayoub project uses a different hostname.
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
