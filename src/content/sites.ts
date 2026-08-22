export const SITE_IDS = {
  FATNI: "fatni-photography",
  AYOUB: "ayoub-el-fatni",
} as const;

export type SiteId = (typeof SITE_IDS)[keyof typeof SITE_IDS];

export type CatalogSite = {
  id: SiteId;
  name: string;
};

export const sites: readonly CatalogSite[] = [
  { id: SITE_IDS.FATNI, name: "Fatni Photography" },
  { id: SITE_IDS.AYOUB, name: "Ayoub El Fatni" },
] as const;

export function isSiteId(value: string): value is SiteId {
  return sites.some((site) => site.id === value);
}
