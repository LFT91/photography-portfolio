import type { PhotoCategory } from "@/lib/photo";

/**
 * Fatni public archive collections.
 * Photographs come from Supabase membership/order; this config drives
 * public hrefs. After Dark is Ayoub-only (not a Fatni collection).
 *
 * Adding a future collection: seed a collections row (site_id + slug + title),
 * extend PhotoCategory if needed, and append a def here (or rely on DB
 * slug → /work/[slug] once title is a known category).
 */
export type FatniCollectionDef = {
  slug: string;
  title: PhotoCategory;
  /** Public path visitors open. */
  href: string;
  /** Unique public meta description for this collection page. */
  description: string;
  /**
   * Not shown on the Fatni archive index/homepage preview
   * (kept for routing / project presentation).
   */
  special?: boolean;
};

/** Public Fatni archive rooms. */
export const FATNI_PUBLIC_COLLECTIONS: readonly FatniCollectionDef[] = [
  {
    slug: "nature",
    title: "Nature",
    href: "/work/nature",
    description:
      "Nature photography by Ayoub El Fatni, from landscapes to quieter outdoor scenes.",
  },
  {
    slug: "urban",
    title: "Urban",
    href: "/work/urban",
    description:
      "Urban photography by Ayoub El Fatni, looking at cities, architecture and built space.",
  },
  {
    slug: "astro",
    title: "Astro",
    href: "/work/astro",
    description:
      "Astrophotography by Ayoub El Fatni, including night-sky and star-trail work.",
  },
  {
    slug: "street",
    title: "Street",
    href: "/work/street",
    description:
      "Street photography by Ayoub El Fatni, made among people, movement and public space.",
  },
  {
    slug: "monochrome",
    title: "Monochrome",
    href: "/work/monochrome",
    description:
      "Monochrome photography by Ayoub El Fatni, in black and white.",
  },
] as const;

export type FatniCollectionSummary = {
  slug: string;
  title: PhotoCategory;
  href: string;
  special: boolean;
  count: number;
  /** First membership-ordered photograph (Collection Manager sequence). */
  cover: {
    src: string;
    title: string;
  } | null;
};

export function fatniHrefForSlug(slug: string): string {
  const known = FATNI_PUBLIC_COLLECTIONS.find((c) => c.slug === slug);
  if (known) return known.href;
  return `/work/${slug}`;
}

export function fatniDefBySlug(slug: string): FatniCollectionDef | undefined {
  return FATNI_PUBLIC_COLLECTIONS.find((c) => c.slug === slug);
}

export function fatniDefByTitle(
  title: string,
): FatniCollectionDef | undefined {
  return FATNI_PUBLIC_COLLECTIONS.find((c) => c.title === title);
}

/** Regular archive rooms (excludes any special / non-index rooms). */
export function fatniArchiveCollections(): FatniCollectionDef[] {
  return FATNI_PUBLIC_COLLECTIONS.filter((c) => !c.special);
}

export function fatniAdjacentArchive(
  slug: string,
): { prev: FatniCollectionDef | null; next: FatniCollectionDef | null } {
  const rooms = fatniArchiveCollections();
  const i = rooms.findIndex((c) => c.slug === slug);
  if (i < 0) return { prev: null, next: null };
  return {
    prev: i > 0 ? rooms[i - 1]! : null,
    next: i < rooms.length - 1 ? rooms[i + 1]! : null,
  };
}
