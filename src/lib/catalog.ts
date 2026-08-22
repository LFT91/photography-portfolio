import { collections, type CatalogCollection } from "@/content/collections";
import { photos as catalogPhotos, type PhotoCategory } from "@/content/photos";
import { SITE_IDS, type SiteId } from "@/content/sites";
import type { Photo } from "@/data/photos";
import { FATNI_PUBLIC_COLLECTIONS, type FatniCollectionSummary } from "@/lib/fatni-collections";

export function photoById(id: string) {
  return catalogPhotos.find((photo) => photo.id === id);
}

export function collectionsForSite(siteId: SiteId): CatalogCollection[] {
  return collections
    .filter((collection) => collection.siteId === siteId)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function collectionById(id: string) {
  return collections.find((collection) => collection.id === id);
}

export function assignedPhotoIds(): Set<string> {
  const ids = new Set<string>();
  for (const collection of collections) {
    for (const photoId of collection.photoIds) ids.add(photoId);
  }
  return ids;
}

export function unassignedPhotos() {
  const assigned = assignedPhotoIds();
  return catalogPhotos.filter((photo) => !assigned.has(photo.id));
}

export function photosForSite(siteId: SiteId): Photo[] {
  const siteCollections = collectionsForSite(siteId);
  const byId = new Map<
    string,
    {
      photo: Photo;
      tabByCategory: Partial<Record<PhotoCategory, number>>;
    }
  >();

  for (const collection of siteCollections) {
    collection.photoIds.forEach((photoId, index) => {
      const record = photoById(photoId);
      if (!record) return;
      let acc = byId.get(photoId);
      if (!acc) {
        acc = {
          photo: {
            id: record.id,
            src: record.src,
            title: record.title,
            categories: [],
            collectionOrders: {},
            sortOrder: index,
            displayScale: record.displayScale ?? 1,
          },
          tabByCategory: {},
        };
        byId.set(photoId, acc);
      }
      const { photo, tabByCategory } = acc;
      if (!photo.categories.includes(collection.title)) {
        photo.categories.push(collection.title);
      }
      photo.collectionOrders = {
        ...photo.collectionOrders,
        [collection.title]: index,
      };
      tabByCategory[collection.title] = collection.sortOrder;
      photo.sortOrder = Math.min(photo.sortOrder ?? index, index);
    });
  }

  const list = [...byId.values()];
  list.sort((a, b) => {
    const aKey = primaryOrderKey(a);
    const bKey = primaryOrderKey(b);
    if (aKey[0] !== bKey[0]) return aKey[0] - bKey[0];
    if (aKey[1] !== bKey[1]) return aKey[1] - bKey[1];
    return a.photo.id.localeCompare(b.photo.id);
  });
  return list.map((entry) => entry.photo);
}

function primaryOrderKey(acc: {
  photo: Photo;
  tabByCategory: Partial<Record<PhotoCategory, number>>;
}): [number, number] {
  let bestTab = Number.MAX_SAFE_INTEGER;
  let bestPos = Number.MAX_SAFE_INTEGER;
  for (const category of acc.photo.categories) {
    const tab = acc.tabByCategory[category] ?? Number.MAX_SAFE_INTEGER;
    const pos = acc.photo.collectionOrders?.[category] ?? Number.MAX_SAFE_INTEGER;
    if (tab < bestTab || (tab === bestTab && pos < bestPos)) {
      bestTab = tab;
      bestPos = pos;
    }
  }
  return [bestTab, bestPos];
}

export function photoOrderInCategory(photo: Photo, category: PhotoCategory): number {
  return photo.collectionOrders?.[category] ?? photo.sortOrder ?? 0;
}

export function collectionPhotos(
  siteId: SiteId,
  category: PhotoCategory,
): Photo[] {
  return photosForSite(siteId)
    .filter((photo) => photo.categories.includes(category))
    .sort(
      (a, b) =>
        photoOrderInCategory(a, category) - photoOrderInCategory(b, category),
    );
}

export function fatniCollectionSummaries(): FatniCollectionSummary[] {
  const siteCollections = collectionsForSite(SITE_IDS.FATNI);
  const summaries: FatniCollectionSummary[] = [];

  for (const def of FATNI_PUBLIC_COLLECTIONS.filter((item) => !item.special)) {
    const collection = siteCollections.find(
      (item) => item.slug === def.slug || item.title === def.title,
    );
    const photoIds = collection?.photoIds ?? [];
    const coverRecord = photoIds.map((id) => photoById(id)).find(Boolean);
    summaries.push({
      slug: def.slug,
      title: def.title,
      href: def.href,
      special: false,
      count: photoIds.length,
      cover: coverRecord
        ? { src: coverRecord.src, title: coverRecord.title }
        : null,
    });
  }

  return summaries;
}

export function heroPhotograph(): Photo {
  const bySrc = catalogPhotos.find((photo) => photo.src.includes("startrails"));
  if (bySrc) {
    return {
      id: bySrc.id,
      src: bySrc.src,
      title: bySrc.title,
      categories: ["Astro"],
      displayScale: bySrc.displayScale,
    };
  }
  return {
    id: "startrails",
    src: "/images/startrails.jpg",
    title: "Star Trails",
    categories: ["Astro"],
  };
}
