import type { MetadataRoute } from "next";
import { fatniArchiveCollections } from "@/lib/fatni-collections";
import { getPublicSiteUrl, isAyoubSite } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getPublicSiteUrl();

  if (isAyoubSite()) {
    return [
      "",
      "/work",
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

  // After Dark remains reachable at /after-dark but is not publicly indexed.
  const collectionPaths = fatniArchiveCollections().map((c) => c.href);
  return ["", "/work", ...collectionPaths, "/about", "/contact"].map(
    (path) => ({
      url: `${base}${path || "/"}`,
      lastModified: new Date(),
    }),
  );
}
