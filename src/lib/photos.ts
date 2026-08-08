import { photos as staticPhotos, type Photo } from "@/data/photos";
import {
  FATNI_SITE_ID,
  mapCollectionMemberships,
  mapDbPhoto,
  type DbCollectionMembership,
  type DbPhoto,
} from "@/lib/photo-map";
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

async function getPhotosFromCollections(
  supabase: SupabaseClient,
): Promise<Photo[] | null> {
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
    .eq("site_id", FATNI_SITE_ID)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return null;
  }

  const memberships = flattenCollectionRows(data as CollectionQueryRow[]);
  if (!memberships.length) {
    return null;
  }

  return mapCollectionMemberships(memberships);
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

/**
 * Fatni public catalog.
 * Prefer collections / collection_photos for site fatni-photography;
 * fall back to legacy photos.categories + sort_order; then static catalog.
 */
export async function getPhotos(): Promise<Photo[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return staticPhotos;
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const fromCollections = await getPhotosFromCollections(supabase);
    if (fromCollections?.length) {
      return fromCollections;
    }

    const legacy = await getPhotosLegacy(supabase);
    if (legacy?.length) {
      return legacy;
    }

    return staticPhotos;
  } catch {
    return staticPhotos;
  }
}
