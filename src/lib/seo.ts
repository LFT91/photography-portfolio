import type { Metadata } from "next";
import { fatniArchiveCollections } from "@/lib/fatni-collections";
import {
  FATNI_PUBLIC_URL,
  FATNI_SITE_NAME,
  PHOTOGRAPHER_NAME,
  getActiveSite,
  getPublicSiteUrl,
  isAyoubSite,
  isFatniSite,
  sitePageTitle,
} from "@/lib/site";

export const FATNI_HOME_TITLE =
  "Ayoub El Fatni Photography | Fatni Photography";
export const FATNI_HOME_DESCRIPTION =
  "Photography by Ayoub El Fatni, featuring street, urban, nature, astrophotography and monochrome work.";
export const FATNI_ABOUT_TITLE =
  "Ayoub El Fatni | Photographer | Fatni Photography";
export const FATNI_ABOUT_DESCRIPTION =
  "Fatni Photography is the broader photography portfolio of Ayoub El Fatni.";
export const FATNI_WORK_DESCRIPTION =
  "Collections of photography by Ayoub El Fatni, spanning street, urban, nature, astrophotography and monochrome.";
export const FATNI_CONTACT_DESCRIPTION =
  "Contact Ayoub El Fatni at Fatni Photography for inquiries, collaborations, or print requests.";

/** Existing hero / share photograph already used for Open Graph. */
export const SHARE_IMAGE = {
  url: "/images/hero/startrails.jpg",
  width: 1600,
  height: 1364,
  alt: "Star Trails",
} as const;

export function isPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

export function indexingRobots(): Metadata["robots"] {
  if (isPreviewDeployment()) {
    return { index: false, follow: false };
  }

  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

export function publicPageMetadata(opts: {
  /** Short title, e.g. "Collections". Fatni adds "| Fatni Photography" via the layout template. */
  title: string;
  description: string;
  path: string;
  absoluteTitle?: string;
}): Metadata {
  const site = getActiveSite();
  const fullTitle =
    opts.absoluteTitle ??
    (isFatniSite() ? `${opts.title} | ${site.name}` : sitePageTitle(opts.title));

  const canonical = canonicalPath(opts.path);

  return {
    title: opts.absoluteTitle
      ? { absolute: opts.absoluteTitle }
      : isFatniSite()
        ? opts.title
        : sitePageTitle(opts.title),
    description: opts.description,
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description: opts.description,
      url: canonical,
      siteName: site.name,
      type: "website",
      locale: "en",
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: opts.description,
      images: [SHARE_IMAGE.url],
    },
  };
}

export function publicSitemapPaths(): string[] {
  if (isAyoubSite()) {
    return [
      "/",
      "/monochrome",
      "/projects",
      "/projects/after-dark",
      "/about",
      "/contact",
    ];
  }

  return [
    "/",
    "/work",
    ...fatniArchiveCollections().map((collection) => collection.href),
    "/about",
    "/contact",
  ];
}

export function sitemapEntries(): { url: string }[] {
  const base = getPublicSiteUrl();
  return publicSitemapPaths().map((path) => ({
    url: path === "/" ? `${base}/` : `${base}${path}`,
  }));
}

export function canonicalPath(path: string): string {
  const origin = getPublicSiteUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path === "/") return `${origin}/`;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function fatniHomeJsonLd() {
  const origin = FATNI_PUBLIC_URL;
  const websiteId = `${origin}/#website`;
  const personId = `${origin}/#person`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: FATNI_SITE_NAME,
        url: `${origin}/`,
        inLanguage: "en",
        publisher: { "@id": personId },
        author: { "@id": personId },
        mainEntity: { "@id": personId },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: PHOTOGRAPHER_NAME,
        url: `${origin}/about`,
        jobTitle: "Photographer",
        brand: {
          "@type": "Brand",
          name: FATNI_SITE_NAME,
          url: `${origin}/`,
        },
      },
    ],
  };
}

export function fatniPersonJsonLd() {
  const origin = FATNI_PUBLIC_URL;

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${origin}/#person`,
    name: PHOTOGRAPHER_NAME,
    url: `${origin}/about`,
    jobTitle: "Photographer",
    brand: {
      "@type": "Brand",
      name: FATNI_SITE_NAME,
      url: `${origin}/`,
    },
  };
}
