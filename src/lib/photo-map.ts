import type { Photo, PhotoCategory } from "@/data/photos";
import { resolvePhotoUrl } from "@/lib/photo-url";

export {
  AYOUB_SITE_ID,
  FATNI_SITE_ID,
  getActiveSiteId,
} from "@/lib/site";

export const PHOTO_CATEGORIES: readonly PhotoCategory[] = [
  "Nature",
  "Urban",
  "Astro",
  "Street",
  "Monochrome",
  "After Dark",
  "Selected Work",
] as const;

export type DbPhoto = {
  id: string;
  title: string;
  storage_path: string;
  public_url: string;
  categories: string[];
  night_kind: string | null;
  sort_order: number;
  display_scale?: number | null;
};

/** Nested row from collections → collection_photos → photos. */
export type DbCollectionMembership = {
  title: string;
  collection_tab_order: number;
  membership_sort_order: number;
  photo: {
    id: string;
    title: string;
    storage_path: string;
    public_url: string;
    display_scale?: number | null;
  };
};

export function isPhotoCategory(value: string): value is PhotoCategory {
  return (PHOTO_CATEGORIES as readonly string[]).includes(value);
}

export function mapDbPhoto(row: DbPhoto): Photo {
  return {
    id: row.id,
    src: resolvePhotoUrl(row.public_url),
    title: row.title,
    categories: row.categories.filter(isPhotoCategory),
    sortOrder: row.sort_order,
    storagePath: row.storage_path,
    displayScale: row.display_scale ?? 1,
  };
}

/**
 * Build Photo[] from collection memberships (Fatni or Ayoub).
 * categories + collectionOrders come from collections; sortOrder is the
 * minimum membership order (legacy-compatible single rank).
 */
export function mapCollectionMemberships(
  rows: DbCollectionMembership[],
): Photo[] {
  type Acc = {
    photo: Photo;
    tabByCategory: Partial<Record<PhotoCategory, number>>;
  };
  const byId = new Map<string, Acc>();

  for (const row of rows) {
    if (!isPhotoCategory(row.title)) continue;
    const p = row.photo;
    if (!p?.id) continue;

    let acc = byId.get(p.id);
    if (!acc) {
      acc = {
        photo: {
          id: p.id,
          src: resolvePhotoUrl(p.public_url),
          title: p.title,
          categories: [],
          collectionOrders: {},
          sortOrder: row.membership_sort_order,
          storagePath: p.storage_path,
          displayScale: p.display_scale ?? 1,
        },
        tabByCategory: {},
      };
      byId.set(p.id, acc);
    }

    const { photo, tabByCategory } = acc;
    if (!photo.categories.includes(row.title)) {
      photo.categories.push(row.title);
    }
    photo.collectionOrders = {
      ...photo.collectionOrders,
      [row.title]: row.membership_sort_order,
    };
    tabByCategory[row.title] = row.collection_tab_order;
    photo.sortOrder = Math.min(
      photo.sortOrder ?? row.membership_sort_order,
      row.membership_sort_order,
    );
  }

  const list = [...byId.values()];

  // Stable flat order: collection tab order, then membership order, then id.
  // Filtering by category preserves relative order for single-membership photos.
  list.sort((a, b) => {
    const aKey = primaryOrderKey(a);
    const bKey = primaryOrderKey(b);
    if (aKey[0] !== bKey[0]) return aKey[0] - bKey[0];
    if (aKey[1] !== bKey[1]) return aKey[1] - bKey[1];
    return (a.photo.id ?? "").localeCompare(b.photo.id ?? "");
  });

  return list.map((a) => a.photo);
}

function primaryOrderKey(acc: {
  photo: Photo;
  tabByCategory: Partial<Record<PhotoCategory, number>>;
}): [number, number] {
  let bestTab = Number.MAX_SAFE_INTEGER;
  let bestPos = Number.MAX_SAFE_INTEGER;
  for (const cat of acc.photo.categories) {
    const tab = acc.tabByCategory[cat] ?? Number.MAX_SAFE_INTEGER;
    const pos = acc.photo.collectionOrders?.[cat] ?? Number.MAX_SAFE_INTEGER;
    if (tab < bestTab || (tab === bestTab && pos < bestPos)) {
      bestTab = tab;
      bestPos = pos;
    }
  }
  return [bestTab, bestPos];
}

/** Sort key for a photo inside a specific collection/category room. */
export function photoOrderInCategory(
  photo: Photo,
  category: PhotoCategory,
): number {
  return photo.collectionOrders?.[category] ?? photo.sortOrder ?? 0;
}
