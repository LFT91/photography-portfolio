import { photoInCategory, type Photo, type PhotoCategory } from "@/data/photos";
import {
  collectionPhotos,
  fatniCollectionSummaries,
  photosForSite,
} from "@/lib/catalog";
import { getActiveSiteId, isFatniSite } from "@/lib/site";

export { photoOrderInCategory } from "@/lib/catalog";

/**
 * Public catalog for the active site (NEXT_PUBLIC_SITE_ID).
 * Source of truth: src/content/photos.ts + src/content/collections.ts.
 */
export async function getPhotos(): Promise<Photo[]> {
  return photosForSite(getActiveSiteId());
}

export async function getCollectionPhotos(
  collection: PhotoCategory,
): Promise<Photo[]> {
  return collectionPhotos(getActiveSiteId(), collection);
}

export async function getFatniCollectionSummaries() {
  if (!isFatniSite()) return [];
  return fatniCollectionSummaries();
}

export { photoInCategory };
export type { Photo, PhotoCategory };
