export const SITE_IDS = {
  FATNI: "fatni-photography",
  AYOUB: "ayoub-el-fatni",
} as const;

export type SiteId = (typeof SITE_IDS)[keyof typeof SITE_IDS];

export type SiteNavLink = {
  href: string;
  label: string;
  external?: boolean;
};

export type SiteConfig = {
  id: SiteId;
  name: string;
  description: string;
  ogDescription: string;
  nav: SiteNavLink[];
};

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

export const DEFAULT_SITE_ID: SiteId = SITE_IDS.FATNI;
export const FATNI_SITE_ID = SITE_IDS.FATNI;
export const AYOUB_SITE_ID = SITE_IDS.AYOUB;
