import {
  AYOUB_PUBLIC_URL,
  AYOUB_SITE_ID,
  DEFAULT_SITE_ID,
  FATNI_PUBLIC_URL,
  FATNI_SITE_ID,
  SITES,
  type SiteId,
} from "@/content/sites";

export {
  AYOUB_PUBLIC_URL,
  AYOUB_SITE_ID,
  DEFAULT_SITE_ID,
  FATNI_PUBLIC_URL,
  FATNI_SITE_ID,
  FATNI_SITE_NAME,
  PHOTOGRAPHER_NAME,
  SITES,
  SITE_IDS,
  type SiteConfig,
  type SiteId,
  type SiteNavLink,
} from "@/content/sites";

export function isSiteId(value: string): value is SiteId {
  return Object.prototype.hasOwnProperty.call(SITES, value);
}

export function getActiveSiteId(): SiteId {
  const raw = process.env.NEXT_PUBLIC_SITE_ID?.trim();
  if (raw && isSiteId(raw)) return raw;
  return DEFAULT_SITE_ID;
}

export function getActiveSite() {
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
