import {
  buildCurationPhoto,
  type CurationPhoto,
} from "@/lib/curation";
import type { SupabaseClient } from "@supabase/supabase-js";

type PhotoRow = {
  id: string;
  title: string;
  storage_path: string;
  public_url: string;
  created_at: string | null;
  display_scale: number | null;
  categories: string[] | null;
  sort_order: number | null;
};

type MembershipRow = {
  photo_id: string;
  sort_order: number;
  collection:
    | {
        id: string;
        title: string;
        slug: string;
        site_id: string;
      }
    | {
        id: string;
        title: string;
        slug: string;
        site_id: string;
      }[]
    | null;
};

function unwrapCollection(
  raw: MembershipRow["collection"],
): {
  id: string;
  title: string;
  slug: string;
  site_id: string;
} | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

/**
 * Two parallel queries (not N+1), then join in memory.
 * Allocation truth comes only from collection_photos.
 */
export async function loadCurationPhotos(
  supabase: SupabaseClient,
): Promise<{ photos: CurationPhoto[]; error: string | null }> {
  const [photosRes, membershipsRes] = await Promise.all([
    supabase
      .from("photos")
      .select(
        "id, title, storage_path, public_url, created_at, display_scale, categories, sort_order",
      )
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("collection_photos")
      .select(
        "photo_id, sort_order, collection:collections ( id, title, slug, site_id )",
      ),
  ]);

  if (photosRes.error) {
    return { photos: [], error: photosRes.error.message };
  }
  if (membershipsRes.error) {
    return { photos: [], error: membershipsRes.error.message };
  }

  const byPhoto = new Map<
    string,
    {
      collectionId: string;
      siteId: string;
      slug: string;
      title: string;
      sortOrder: number;
    }[]
  >();

  for (const row of (membershipsRes.data ?? []) as MembershipRow[]) {
    const collection = unwrapCollection(row.collection);
    if (!collection?.id) continue;
    const list = byPhoto.get(row.photo_id) ?? [];
    list.push({
      collectionId: collection.id,
      siteId: collection.site_id,
      slug: collection.slug,
      title: collection.title,
      sortOrder: row.sort_order,
    });
    byPhoto.set(row.photo_id, list);
  }

  const photos = ((photosRes.data ?? []) as PhotoRow[]).map((row) =>
    buildCurationPhoto({
      id: row.id,
      title: row.title,
      storagePath: row.storage_path,
      publicUrl: row.public_url,
      createdAt: row.created_at,
      displayScale: row.display_scale,
      legacyCategories: row.categories,
      legacySortOrder: row.sort_order,
      memberships: byPhoto.get(row.id) ?? [],
    }),
  );

  return { photos, error: null };
}

export type SiteOption = { id: string; name: string };
export type CollectionOption = {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  sortOrder: number;
};

export async function loadCurationFilterOptions(
  supabase: SupabaseClient,
): Promise<{
  sites: SiteOption[];
  collections: CollectionOption[];
  error: string | null;
}> {
  const [sitesRes, collectionsRes] = await Promise.all([
    supabase.from("sites").select("id, name").order("name", { ascending: true }),
    supabase
      .from("collections")
      .select("id, site_id, title, slug, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  if (sitesRes.error) {
    return { sites: [], collections: [], error: sitesRes.error.message };
  }
  if (collectionsRes.error) {
    return { sites: [], collections: [], error: collectionsRes.error.message };
  }

  return {
    sites: (sitesRes.data ?? []).map((s) => ({
      id: s.id as string,
      name: s.name as string,
    })),
    collections: (collectionsRes.data ?? []).map((c) => ({
      id: c.id as string,
      siteId: c.site_id as string,
      title: c.title as string,
      slug: c.slug as string,
      sortOrder: c.sort_order as number,
    })),
    error: null,
  };
}
