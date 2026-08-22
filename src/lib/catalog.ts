import { collections, FATNI_COLLECTION_DEFS } from "@/content/collections";
import { photos, type CatalogPhotoId, type PhotoRecord } from "@/content/photos";
import type { Photo, PhotoCategory } from "@/lib/photo";
import { isAyoubSite, isFatniSite } from "@/lib/site";

export type FatniCollectionSummary = {
  slug: string;
  title: PhotoCategory;
  href: string;
  count: number;
  cover: { src: string; title: string } | null;
};

function record(id: string): PhotoRecord {
  if (!(id in photos)) {
    throw new Error(`Unknown photograph: ${id}`);
  }
  return photos[id as CatalogPhotoId];
}

export function photoFromId(id: string, category: PhotoCategory): Photo {
  const photo = record(id);
  return {
    id,
    src: photo.src,
    title: photo.title,
    categories: [category],
    displayScale: photo.displayScale,
  };
}

export function getCollectionPhotos(category: PhotoCategory): Photo[] {
  if (isFatniSite()) {
    const def = FATNI_COLLECTION_DEFS.find((item) => item.title === category);
    if (!def) return [];
    return collections.fatni[def.key].map((id) => photoFromId(id, category));
  }

  if (isAyoubSite() && category === "After Dark") {
    return collections.ayoub.afterDark.map((id) =>
      photoFromId(id, "After Dark"),
    );
  }

  if (isAyoubSite() && category === "Monochrome") {
    return collections.ayoub.monochrome.map((id) =>
      photoFromId(id, "Monochrome"),
    );
  }

  return [];
}

export function getFatniCollectionSummaries(): FatniCollectionSummary[] {
  if (!isFatniSite()) return [];

  return FATNI_COLLECTION_DEFS.map((def) => {
    const ids = collections.fatni[def.key];
    const first = ids[0];
    const cover = first ? record(first) : null;
    return {
      slug: def.slug,
      title: def.title,
      href: def.href,
      count: ids.length,
      cover: cover ? { src: cover.src, title: cover.title } : null,
    };
  });
}
