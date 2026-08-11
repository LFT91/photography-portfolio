import {
  photoInCategory,
  photos as staticPhotos,
  type Photo,
  type PhotoCategory,
} from "@/data/photos";
import {
  FATNI_PUBLIC_COLLECTIONS,
  fatniHrefForSlug,
  type FatniCollectionSummary,
} from "@/lib/fatni-collections";
import {
  isPhotoCategory,
  mapCollectionMemberships,
  mapDbPhoto,
  photoOrderInCategory,
  type DbCollectionMembership,
  type DbPhoto,
} from "@/lib/photo-map";
import { FATNI_SITE_ID, getActiveSiteId, isFatniSite } from "@/lib/site";
import type { SupabaseClient } from "@supabase/supabase-js";

type CollectionQueryRow = {
  title: string;
  slug?: string;
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
      slug,
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
    .order("sort_order", { ascending: true })
    .order("sort_order", {
      ascending: true,
      referencedTable: "collection_photos",
    });

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

function coverFromMemberships(
  links: CollectionQueryRow["collection_photos"],
): FatniCollectionSummary["cover"] {
  if (!links?.length) return null;
  const ordered = [...links].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  for (const link of ordered) {
    const raw = link.photo;
    const photo = Array.isArray(raw) ? raw[0] : raw;
    if (!photo?.public_url) continue;
    return { src: photo.public_url, title: photo.title };
  }
  return null;
}

function fatniSummariesFromStatic(): FatniCollectionSummary[] {
  return FATNI_PUBLIC_COLLECTIONS.filter((def) => !def.special).map((def) => {
    const members = staticPhotos
      .filter((p) => photoInCategory(p, def.title))
      .sort(
        (a, b) =>
          photoOrderInCategory(a, def.title) -
          photoOrderInCategory(b, def.title),
      );
    const first = members[0];
    return {
      slug: def.slug,
      title: def.title,
      href: def.href,
      special: false,
      count: members.length,
      cover: first ? { src: first.src, title: first.title } : null,
    };
  });
}

/**
 * Fatni public archive index tiles — DB order + first membership as cover.
 * Empty on non-Fatni deployments. Retired rooms (e.g. After Dark) are skipped.
 */
export async function getFatniCollectionSummaries(): Promise<
  FatniCollectionSummary[]
> {
  if (!isFatniSite()) return [];

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return fatniSummariesFromStatic();
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const siteId = getActiveSiteId();

    const { data, error } = await supabase
      .from("collections")
      .select(
        `
        title,
        slug,
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
      .order("sort_order", { ascending: true })
      .order("sort_order", {
        ascending: true,
        referencedTable: "collection_photos",
      });

    if (error || !data?.length) {
      return fatniSummariesFromStatic();
    }

    const rows = data as CollectionQueryRow[];
    const summaries: FatniCollectionSummary[] = [];

    for (const row of rows) {
      if (!isPhotoCategory(row.title)) continue;
      const slug =
        row.slug ||
        FATNI_PUBLIC_COLLECTIONS.find((c) => c.title === row.title)?.slug;
      if (!slug) continue;

      const def = FATNI_PUBLIC_COLLECTIONS.find((c) => c.slug === slug);
      const special = Boolean(def?.special) || slug === "after-dark";
      // Public archive index: Nature / Urban / Astro / Street / Monochrome only.
      if (special) continue;

      const links = row.collection_photos ?? [];
      const count = links.filter((link) => {
        const raw = link.photo;
        const photo = Array.isArray(raw) ? raw[0] : raw;
        return Boolean(photo?.id);
      }).length;

      summaries.push({
        slug,
        title: row.title,
        href: def?.href ?? fatniHrefForSlug(slug),
        special: false,
        count,
        cover: coverFromMemberships(links),
      });
    }

    return summaries.length ? summaries : fatniSummariesFromStatic();
  } catch {
    return fatniSummariesFromStatic();
  }
}
