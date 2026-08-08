/** Supported public sites (matches public.sites.id). */
export const SITE_IDS = {
  FATNI: "fatni-photography",
  AYOUB: "ayoub-el-fatni",
} as const;

export type SiteId = (typeof SITE_IDS)[keyof typeof SITE_IDS];

export type SiteConfig = {
  id: SiteId;
  name: string;
};

export const SITES: Record<SiteId, SiteConfig> = {
  "fatni-photography": {
    id: "fatni-photography",
    name: "Fatni Photography",
  },
  "ayoub-el-fatni": {
    id: "ayoub-el-fatni",
    name: "Ayoub El Fatni",
  },
};

/** Used when NEXT_PUBLIC_SITE_ID is unset or invalid — keeps production Fatni compatible. */
export const DEFAULT_SITE_ID: SiteId = SITE_IDS.FATNI;

export const FATNI_SITE_ID = SITE_IDS.FATNI;
export const AYOUB_SITE_ID = SITE_IDS.AYOUB;

export function isSiteId(value: string): value is SiteId {
  return Object.prototype.hasOwnProperty.call(SITES, value);
}

/** Active public site for this deployment. */
export function getActiveSiteId(): SiteId {
  const raw = process.env.NEXT_PUBLIC_SITE_ID?.trim();
  if (raw && isSiteId(raw)) return raw;
  return DEFAULT_SITE_ID;
}

export function getActiveSite(): SiteConfig {
  return SITES[getActiveSiteId()];
}
