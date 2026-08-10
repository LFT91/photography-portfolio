import {
  buildCurationPhoto,
  type CurationPhoto,
} from "@/lib/curation";
import {
  compositeMembershipId,
  type DryRunLiveSnapshot,
  type MembershipIdentitySchemaInfo,
} from "@/lib/curation-dry-run";
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
      membershipId: string;
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
    // collection_photos has no surrogate id — composite (collection_id, photo_id) is the stable row identity.
    const membershipId = compositeMembershipId(collection.id, row.photo_id);
    const list = byPhoto.get(row.photo_id) ?? [];
    list.push({
      membershipId,
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

/** Read-only snapshot for Phase 3 dry-run planning. */
export function toDryRunLiveSnapshot(
  photos: CurationPhoto[],
  collections: CollectionOption[],
  membershipIdentitySchema?: MembershipIdentitySchemaInfo | null,
): DryRunLiveSnapshot {
  const memberships = photos.flatMap((photo) =>
    photo.memberships
      .filter((m) => Boolean(m.membershipId))
      .map((m) => ({
        id: m.membershipId as string,
        photo_id: photo.id,
        collection_id: m.collectionId,
        sort_order: m.sortOrder,
        collection: {
          id: m.collectionId,
          title: m.title,
          slug: m.slug,
          site_id: m.siteId,
        },
      })),
  );

  return {
    photos: photos.map((p) => ({
      id: p.id,
      title: p.title,
      storage_path: p.storagePath,
    })),
    memberships,
    collections: collections.map((c) => ({
      id: c.id,
      site_id: c.siteId,
      title: c.title,
      slug: c.slug,
    })),
    membership_identity_schema: membershipIdentitySchema ?? null,
  };
}

/**
 * Read-only introspection: does a PK/UNIQUE cover (collection_id, photo_id)?
 * Uses information_schema when accessible; never mutates.
 */
export async function loadCollectionPhotosIdentitySchema(
  supabase: SupabaseClient,
): Promise<MembershipIdentitySchemaInfo> {
  const base: MembershipIdentitySchemaInfo = {
    identity_model: "collection_id:photo_id",
    composite_unique_or_pk_found: null,
    constraint_name: null,
    constraint_type: null,
    columns: [],
    detail: "Schema introspection unavailable.",
  };

  try {
    const info = supabase.schema("information_schema");
    const { data: constraints, error: cErr } = await info
      .from("table_constraints")
      .select("constraint_name, constraint_type")
      .eq("table_schema", "public")
      .eq("table_name", "collection_photos")
      .in("constraint_type", ["PRIMARY KEY", "UNIQUE"]);

    if (cErr) {
      return {
        ...base,
        detail: `information_schema.table_constraints: ${cErr.message}`,
      };
    }

    const { data: usage, error: uErr } = await info
      .from("key_column_usage")
      .select("constraint_name, column_name, ordinal_position")
      .eq("table_schema", "public")
      .eq("table_name", "collection_photos")
      .order("ordinal_position", { ascending: true });

    if (uErr) {
      return {
        ...base,
        detail: `information_schema.key_column_usage: ${uErr.message}`,
      };
    }

    const byConstraint = new Map<string, string[]>();
    for (const row of usage ?? []) {
      const name = String(row.constraint_name);
      const cols = byConstraint.get(name) ?? [];
      cols.push(String(row.column_name));
      byConstraint.set(name, cols);
    }

    for (const c of constraints ?? []) {
      const name = String(c.constraint_name);
      const cols = byConstraint.get(name) ?? [];
      const normalized = cols.map((x) => x.toLowerCase());
      const coversComposite =
        normalized.length === 2 &&
        normalized.includes("collection_id") &&
        normalized.includes("photo_id");
      if (coversComposite) {
        return {
          identity_model: "collection_id:photo_id",
          composite_unique_or_pk_found: true,
          constraint_name: name,
          constraint_type: String(c.constraint_type),
          columns: cols,
          detail: `Found ${c.constraint_type} ${name} on (${cols.join(", ")}).`,
        };
      }
    }

    return {
      identity_model: "collection_id:photo_id",
      composite_unique_or_pk_found: false,
      constraint_name: null,
      constraint_type: null,
      columns: [],
      detail:
        "No PRIMARY KEY or UNIQUE constraint covering (collection_id, photo_id) was found via information_schema.",
    };
  } catch (err) {
    return {
      ...base,
      detail: `Schema introspection threw: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
