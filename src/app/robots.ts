import type { MetadataRoute } from "next";
import { isPreviewDeployment } from "@/lib/seo";
import { getPublicSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteUrl();

  if (isPreviewDeployment()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
