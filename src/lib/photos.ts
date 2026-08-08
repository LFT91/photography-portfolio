import {
  photoInCategory,
  photos as staticPhotos,
  type Photo,
  type PhotoCategory,
} from "@/data/photos";
import {
  mapCollectionMemberships,
  mapDbPhoto,
  photoOrderInCategory,
  type DbCollectionMembership,
  type DbPhoto,
} from "@/lib/photo-map";
import { FATNI_SITE_ID, getActiveSiteId } from "@/lib/site";
import type { SupabaseClient } from "@supabase/supabase-js";

type CollectionQueryRow = {
  title: string;
  sort_order: number;
  collection_photos:
    | {
        sort_order: number;
        photo:
          | {
              id: string;
              title: string;
              storage_path: string;
              public_url: string;
              display_scale: number | null;
            }
          | {
              id: string;
              title: string;
              storage_path: string;
              public_url: string;
              display_scale: number | null;
            }[]
          | null;
      }[]
    | null;
};

type CollectionsRead =
  | { kind: "ok"; photos: Photo[] }
  | { kind: "unavailable" };

function flattenCollectionRows(
  data: CollectionQueryRow[],
): DbCollectionMembership[] {
  const rows: DbCollectionMembership[] = [];
  for (const collection of data) {
    for (const link of collection.collection_photos ?? []) {
      const raw = link.photo;
      const photo = Array.isArray(raw) ? raw[0] : raw;
      if (!photo?.id) continue;
      rows.push({
        title: collection.title,
        collection_tab_order: collection.sort_order,
        membership_sort_order: link.sort_order,
        photo: {
          id: photo.id,
          title: photo.title,
          storage_path: photo.storage_path,
          public_url: photo.public_url,
          display_scale: photo.display_scale,
        },
      });
    }
  }
  return rows;
}

/**
 * Read collections for the active site.
 * - ok + photos (possibly empty): site has collection rows; empty means no memberships
 * - unavailable: query failed or site has no collections — Fatni may use legacy fallback
 */
async function getPhotosFromCollections(
  supabase: SupabaseClient,
): Promise<CollectionsRead> {
  const siteId = getActiveSiteId();
  const { data, error } = await supabase
    .from("collections")
    .select(
      `
      title,
      sort_order,
      collection_photos (
        sort_order,
        photo:photos (
          id,
          title,
          storage_path,
          public_url,
          display_scale
        )
      )
    `,
    )
    .eq("site_id", siteId)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return { kind: "unavailable" };
  }

  const memberships = flattenCollectionRows(data as CollectionQueryRow[]);
  return {
    kind: "ok",
    photos: mapCollectionMemberships(memberships),
  };
}

async function getPhotosLegacy(
  supabase: SupabaseClient,
): Promise<Photo[] | null> {
  const { data, error } = await supabase
    .from("photos")
    .select(
      "id, title, storage_path, public_url, categories, night_kind, sort_order, display_scale",
    )
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return null;
  }

  return (data as DbPhoto[]).map((row) => mapDbPhoto(row));
}

function fatniCompatibilityFallback(): Photo[] {
  return staticPhotos;
}

/**
 * Public catalog for the active site (NEXT_PUBLIC_SITE_ID, default Fatni).
 *
 * Prefer collections / collection_photos. When the site has collection rows but
 * zero memberships, return [] (do not fall through). Legacy photos rows and the
 * static catalog are Fatni compatibility fallbacks only.
 */
export async function getPhotos(): Promise<Photo[]> {
  const siteId = getActiveSiteId();
  const isFatni = siteId === FATNI_SITE_ID;

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return isFatni ? fatniCompatibilityFallback() : [];
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const fromCollections = await getPhotosFromCollections(supabase);
    if (fromCollections.kind === "ok") {
      return fromCollections.photos;
    }

    // Collections unavailable for this site.
    if (!isFatni) {
      return [];
    }

    const legacy = await getPhotosLegacy(supabase);
    if (legacy?.length) {
      return legacy;
    }

    return fatniCompatibilityFallback();
  } catch {
    return isFatni ? fatniCompatibilityFallback() : [];
  }
}

/** Sequenced photos for one collection title on the active site. */
export async function getCollectionPhotos(
  collection: PhotoCategory,
): Promise<Photo[]> {
  const photos = await getPhotos();
  return photos
    .filter((photo) => photoInCategory(photo, collection))
    .sort(
      (a, b) =>
        photoOrderInCategory(a, collection) -
        photoOrderInCategory(b, collection),
    );
}
