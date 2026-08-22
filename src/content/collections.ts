import type { CatalogPhotoId } from "@/content/photos";
import type { PhotoCategory } from "@/lib/photo";
import collectionsJson from "./collections.json";

export type FatniCollectionKey =
  | "nature"
  | "urban"
  | "astro"
  | "street"
  | "monochrome";

export type AyoubCollectionKey = "afterDark" | "monochrome";

export type FatniCollectionDef = {
  key: FatniCollectionKey;
  slug: string;
  title: PhotoCategory;
  href: string;
  description: string;
};

export const FATNI_COLLECTION_DEFS: readonly FatniCollectionDef[] = [
  {
    key: "nature",
    slug: "nature",
    title: "Nature",
    href: "/work/nature",
    description:
      "Nature photography by Ayoub El Fatni, from landscapes to quieter outdoor scenes.",
  },
  {
    key: "urban",
    slug: "urban",
    title: "Urban",
    href: "/work/urban",
    description:
      "Urban photography by Ayoub El Fatni, looking at cities, architecture and built space.",
  },
  {
    key: "astro",
    slug: "astro",
    title: "Astro",
    href: "/work/astro",
    description:
      "Astrophotography by Ayoub El Fatni, including night-sky and star-trail work.",
  },
  {
    key: "street",
    slug: "street",
    title: "Street",
    href: "/work/street",
    description:
      "Street photography by Ayoub El Fatni, made among people, movement and public space.",
  },
  {
    key: "monochrome",
    slug: "monochrome",
    title: "Monochrome",
    href: "/work/monochrome",
    description:
      "Monochrome photography by Ayoub El Fatni, in black and white.",
  },
];

export function fatniCollectionBySlug(
  slug: string,
): FatniCollectionDef | undefined {
  return FATNI_COLLECTION_DEFS.find((collection) => collection.slug === slug);
}

export function fatniAdjacent(
  slug: string,
): { prev: FatniCollectionDef | null; next: FatniCollectionDef | null } {
  const index = FATNI_COLLECTION_DEFS.findIndex(
    (collection) => collection.slug === slug,
  );
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? FATNI_COLLECTION_DEFS[index - 1]! : null,
    next:
      index < FATNI_COLLECTION_DEFS.length - 1
        ? FATNI_COLLECTION_DEFS[index + 1]!
        : null,
  };
}

export type CatalogCollections = {
  fatni: Record<FatniCollectionKey, readonly string[]>;
  ayoub: Record<AyoubCollectionKey, readonly string[]>;
};

/** Ordered photograph IDs for each public collection. Machine-readable source: collections.json. */
export const collections = collectionsJson as CatalogCollections;

export type CollectionPhotoId = string;

export type { CatalogPhotoId };
