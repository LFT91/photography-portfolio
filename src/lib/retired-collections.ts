import { AYOUB_SITE_ID, FATNI_SITE_ID } from "@/lib/site";

export const RETIRED_COLLECTIONS = [
  { siteId: FATNI_SITE_ID, slug: "after-dark", title: "After Dark" },
  { siteId: AYOUB_SITE_ID, slug: "selected-work", title: "Selected Work" },
] as const;

export function isRetiredCollection(siteId: string, slug: string): boolean {
  return RETIRED_COLLECTIONS.some((c) => c.siteId === siteId && c.slug === slug);
}
