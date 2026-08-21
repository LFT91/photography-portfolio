import { cache } from "react";
import {
  photoInCategory,
  type Photo,
  type PhotoCategory,
} from "@/lib/photo";
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
import { resolvePhotoUrl } from "@/lib/photo-url";
import { getActiveSiteId, isFatniSite } from "@/lib/site";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { localPhotos } from "@/data/photos";
import type { SupabaseClient } from "@supabase/supabase-js";

export class CatalogError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "CatalogError";
  }
}

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

export function shouldUseLocalCatalog(
  env: NodeJS.ProcessEnv = process.env,
  supabaseConfigured = hasSupabaseEnv(),
): boolean {
  if (env.USE_LOCAL_CATALOG === "1") return true;
  return !supabaseConfigured && env.NODE_ENV !== "production";
}

export function flattenCollectionRows(
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

async function readCollectionPhotos(
  supabase: SupabaseClient,
): Promise<Photo[]> {
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

  if (error) {
    throw new CatalogError(`Could not load collections: ${error.message}`, {
      cause: error,
    });
  }

  if (!data?.length) {
    return [];
  }

  return mapCollectionMemberships(
    flattenCollectionRows(data as CollectionQueryRow[]),
  );
}

/**
 * Public catalogue for the active site.
 *
 * Production: Supabase collections / collection_photos only.
 * Local fixture: only when USE_LOCAL_CATALOG=1, or when Supabase env is
 * absent in development. Query failures never fall back to the fixture.
 */
export const getPhotos = cache(async function getPhotos(): Promise<Photo[]> {
  if (shouldUseLocalCatalog()) {
    return isFatniSite() ? localPhotos : [];
  }

  if (!hasSupabaseEnv()) {
    throw new CatalogError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const supabase = createPublicClient();
  return readCollectionPhotos(supabase);
});

/** Admin library: collection members plus photos not yet assigned. */
export const getLibraryPhotos = cache(async function getLibraryPhotos(): Promise<
  Photo[]
> {
  if (shouldUseLocalCatalog()) {
    return localPhotos;
  }

  if (!hasSupabaseEnv()) {
    throw new CatalogError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const supabase = createPublicClient();
  const members = await readCollectionPhotos(supabase);
  const { data, error } = await supabase
    .from("photos")
    .select(
      "id, title, storage_path, public_url, categories, night_kind, sort_order, display_scale",
    )
    .order("sort_order", { ascending: true });

  if (error) {
    throw new CatalogError(`Could not load photo library: ${error.message}`, {
      cause: error,
    });
  }

  const memberIds = new Set(members.map((photo) => photo.id));
  const extras = ((data ?? []) as DbPhoto[])
    .filter((row) => !memberIds.has(row.id))
    .map(mapDbPhoto);

  return [...members, ...extras];
});

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
  const ordered = [...links].sort((a, b) => a.sort_order - b.sort_order);
  for (const link of ordered) {
    const raw = link.photo;
    const photo = Array.isArray(raw) ? raw[0] : raw;
    if (!photo?.public_url) continue;
    return { src: resolvePhotoUrl(photo.public_url), title: photo.title };
  }
  return null;
}

function fatniSummariesFromLocal(): FatniCollectionSummary[] {
  return FATNI_PUBLIC_COLLECTIONS.filter((def) => !def.special).map((def) => {
    const members = localPhotos
      .filter((photo) => photoInCategory(photo, def.title))
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

export const getFatniCollectionSummaries = cache(
  async function getFatniCollectionSummaries(): Promise<
    FatniCollectionSummary[]
  > {
    if (!isFatniSite()) return [];

    if (shouldUseLocalCatalog()) {
      return fatniSummariesFromLocal();
    }

    if (!hasSupabaseEnv()) {
      throw new CatalogError(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    }

    const supabase = createPublicClient();
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
      .eq("site_id", getActiveSiteId())
      .order("sort_order", { ascending: true })
      .order("sort_order", {
        ascending: true,
        referencedTable: "collection_photos",
      });

    if (error) {
      throw new CatalogError(`Could not load collections: ${error.message}`, {
        cause: error,
      });
    }

    if (!data?.length) return [];

    const summaries: FatniCollectionSummary[] = [];
    for (const row of data as CollectionQueryRow[]) {
      if (!isPhotoCategory(row.title)) continue;
      const slug =
        row.slug ||
        FATNI_PUBLIC_COLLECTIONS.find((c) => c.title === row.title)?.slug;
      if (!slug) continue;

      const def = FATNI_PUBLIC_COLLECTIONS.find((c) => c.slug === slug);
      if (def?.special || slug === "after-dark") continue;

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

    return summaries;
  },
);
