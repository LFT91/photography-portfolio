import { getPublicSiteUrl } from "@/lib/site";

/**
 * Normalize photo URLs for <img> / next/image.
 * Relative `/images/...` rows must resolve against the active site origin
 * (both Fatni and Ayoub ship the same `public/` tree).
 */
export function resolvePhotoUrl(url: string): string {
  if (!url) return url;
  if (
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }
  if (url.startsWith("/")) {
    const base = getPublicSiteUrl();
    return base ? `${base}${url}` : url;
  }
  return url;
}
