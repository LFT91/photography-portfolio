/** Supported public sites (matches public.sites.id). */
export const SITE_IDS = {
  FATNI: "fatni-photography",
  AYOUB: "ayoub-el-fatni",
} as const;

export type SiteId = (typeof SITE_IDS)[keyof typeof SITE_IDS];

export type SiteNavLink = {
  href: string;
  label: string;
};

export type SiteConfig = {
  id: SiteId;
  name: string;
  /** Short meta / OG description — no commercial services language. */
  description: string;
  ogDescription: string;
  nav: SiteNavLink[];
};

export const SITES: Record<SiteId, SiteConfig> = {
  "fatni-photography": {
    id: "fatni-photography",
    name: "Fatni Photography",
    description:
      "Photographic archive by Ayoub El Fatni — landscapes, travel, street, cities, night, and monochrome.",
    ogDescription:
      "Photographic archive by Ayoub El Fatni — landscapes, travel, street, cities, and night.",
    nav: [
      { href: "/work", label: "Work" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  "ayoub-el-fatni": {
    id: "ayoub-el-fatni",
    name: "Ayoub El Fatni",
    description:
      "Photographs by Ayoub El Fatni — selected work, monochrome, and projects.",
    ogDescription: "Photographs by Ayoub El Fatni.",
    nav: [
      { href: "/monochrome", label: "Monochrome" },
      { href: "/projects/after-dark", label: "After Dark" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
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

export function isFatniSite(): boolean {
  return getActiveSiteId() === FATNI_SITE_ID;
}

export function isAyoubSite(): boolean {
  return getActiveSiteId() === AYOUB_SITE_ID;
}

export function sitePageTitle(page?: string): string {
  const { name } = getActiveSite();
  return page ? `${page} | ${name}` : name;
}
