import { SITE_IDS, isSiteId, type SiteId } from "@/content/sites";

export { SITE_IDS, isSiteId, type SiteId };

export type SiteNavLink = {
  href: string;
  label: string;
  /** Absolute URL to the sister site — open as a normal navigation, not a Next route. */
  external?: boolean;
};

export type SiteConfig = {
  id: SiteId;
  name: string;
  /** Short meta / OG description — no commercial services language. */
  description: string;
  ogDescription: string;
  nav: SiteNavLink[];
};

/** Canonical production origins for cross-site nav (Focused Work / Broader Work). */
export const FATNI_PUBLIC_URL = "https://www.fatniphotography.com";
export const AYOUB_PUBLIC_URL = "https://ayoub-el-fatni.vercel.app";
export const PHOTOGRAPHER_NAME = "Ayoub El Fatni";
export const FATNI_SITE_NAME = "Fatni Photography";

export const SITES: Record<SiteId, SiteConfig> = {
  "fatni-photography": {
    id: "fatni-photography",
    name: FATNI_SITE_NAME,
    description:
      "Photography by Ayoub El Fatni, featuring street, urban, nature, astrophotography and monochrome work.",
    ogDescription:
      "Photography by Ayoub El Fatni, featuring street, urban, nature, astrophotography and monochrome work.",
    nav: [
      { href: "/work", label: "Collections" },
      { href: AYOUB_PUBLIC_URL, label: "Focused Work", external: true },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  "ayoub-el-fatni": {
    id: "ayoub-el-fatni",
    name: "Ayoub El Fatni",
    description:
      "Photographs by Ayoub El Fatni — after dark, monochrome, and projects.",
    ogDescription: "Photographs by Ayoub El Fatni.",
    nav: [
      { href: "/projects/after-dark", label: "After Dark" },
      { href: "/monochrome", label: "Monochrome" },
      { href: FATNI_PUBLIC_URL, label: "Broader Work", external: true },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
};

/** Used when NEXT_PUBLIC_SITE_ID is unset or invalid — keeps production Fatni compatible. */
export const DEFAULT_SITE_ID: SiteId = SITE_IDS.FATNI;

export const FATNI_SITE_ID = SITE_IDS.FATNI;
export const AYOUB_SITE_ID = SITE_IDS.AYOUB;

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

function normalizeOrigin(value: string): string {
  return value.replace(/\/$/, "");
}

function hostnameOf(origin: string): string | null {
  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}

/**
 * Canonical public origin for this deployment (OG, sitemap, robots).
 * Fatni always uses www.fatniphotography.com — never a Vercel preview URL.
 */
export function getPublicSiteUrl(): string {
  if (isAyoubSite()) {
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (fromEnv) return normalizeOrigin(fromEnv);
    return AYOUB_PUBLIC_URL;
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    const host = hostnameOf(normalizeOrigin(fromEnv));
    if (
      host === "www.fatniphotography.com" ||
      host === "fatniphotography.com"
    ) {
      return FATNI_PUBLIC_URL;
    }
  }

  return FATNI_PUBLIC_URL;
}
