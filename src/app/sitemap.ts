import type { MetadataRoute } from "next";
import { fatniArchiveCollections } from "@/lib/fatni-collections";
import { getPublicSiteUrl, isAyoubSite } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getPublicSiteUrl();

  if (isAyoubSite()) {
    return [
      "",
      "/monochrome",
      "/projects",
      "/projects/after-dark",
      "/about",
      "/contact",
    ].map((path) => ({
      url: `${base}${path || "/"}`,
      lastModified: new Date(),
    }));
  }

  const collectionPaths = fatniArchiveCollections().map((c) => c.href);
  return ["", "/work", ...collectionPaths, "/about", "/contact"].map(
    (path) => ({
      url: `${base}${path || "/"}`,
      lastModified: new Date(),
    }),
  );
}
