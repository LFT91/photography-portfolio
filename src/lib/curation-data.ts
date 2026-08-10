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

const COLLECTION_PHOTOS_MIGRATION_DDL = {
  found: true,
  constraint_type: "PRIMARY KEY",
  columns: ["collection_id", "photo_id"],
  source: "supabase/migrations/20260808150000_sites_collections.sql",
} as const;

/**
 * Read-only introspection: does a PK/UNIQUE cover (collection_id, photo_id)?
 * Tries information_schema, then PostgREST OpenAPI. Never mutates.
 * When live schema queries are blocked for the anon client, attaches
 * checked-in migration DDL as corroborating evidence (not a live query result).
 */
export async function loadCollectionPhotosIdentitySchema(
  supabase: SupabaseClient,
): Promise<MembershipIdentitySchemaInfo> {
  const fromInfoSchema = await tryInformationSchema(supabase);
  if (fromInfoSchema.composite_unique_or_pk_found !== null) {
    return fromInfoSchema;
  }

  const fromOpenApi = await tryOpenApiPrimaryKey();
  if (fromOpenApi.composite_unique_or_pk_found !== null) {
    return {
      ...fromOpenApi,
      detail: `${fromInfoSchema.detail} Falling back to OpenAPI: ${fromOpenApi.detail}`,
    };
  }

  return {
    identity_model: "collection_id:photo_id",
    composite_unique_or_pk_found: null,
    constraint_name: null,
    constraint_type: null,
    columns: [],
    detail: [
      fromInfoSchema.detail,
      fromOpenApi.detail,
      `Repo migration DDL declares PRIMARY KEY (${COLLECTION_PHOTOS_MIGRATION_DDL.columns.join(", ")}) in ${COLLECTION_PHOTOS_MIGRATION_DDL.source}.`,
    ]
      .filter(Boolean)
      .join(" "),
    migration_ddl: {
      found: COLLECTION_PHOTOS_MIGRATION_DDL.found,
      constraint_type: COLLECTION_PHOTOS_MIGRATION_DDL.constraint_type,
      columns: [...COLLECTION_PHOTOS_MIGRATION_DDL.columns],
      source: COLLECTION_PHOTOS_MIGRATION_DDL.source,
    },
  };
}

async function tryInformationSchema(
  supabase: SupabaseClient,
): Promise<MembershipIdentitySchemaInfo> {
  const base: MembershipIdentitySchemaInfo = {
    identity_model: "collection_id:photo_id",
    composite_unique_or_pk_found: null,
    constraint_name: null,
    constraint_type: null,
    columns: [],
    detail: "information_schema unavailable.",
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
      detail: `information_schema threw: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function tryOpenApiPrimaryKey(): Promise<MembershipIdentitySchemaInfo> {
  const base: MembershipIdentitySchemaInfo = {
    identity_model: "collection_id:photo_id",
    composite_unique_or_pk_found: null,
    constraint_name: null,
    constraint_type: null,
    columns: [],
    detail: "OpenAPI introspection unavailable.",
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { ...base, detail: "Missing Supabase URL/anon key for OpenAPI." };
  }

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/openapi+json",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      let hint = `OpenAPI HTTP ${res.status}.`;
      try {
        const body = (await res.json()) as { message?: string; hint?: string };
        if (body.message) hint = `OpenAPI HTTP ${res.status}: ${body.message}`;
        if (body.hint) hint += ` (${body.hint})`;
      } catch {
        /* keep status-only hint */
      }
      return { ...base, detail: hint };
    }
    const spec = (await res.json()) as {
      definitions?: Record<
        string,
        { required?: string[]; properties?: Record<string, unknown> }
      >;
    };
    const def =
      spec.definitions?.collection_photos ??
      spec.definitions?.public_collection_photos;
    if (!def) {
      return {
        ...base,
        detail: "OpenAPI has no collection_photos definition.",
      };
    }
    const required = (def.required ?? []).map((c) => c.toLowerCase());
    const covers =
      required.includes("collection_id") && required.includes("photo_id");
    // PostgREST marks PK columns as required; composite PK usually lists both.
    if (covers && required.length === 2) {
      return {
        identity_model: "collection_id:photo_id",
        composite_unique_or_pk_found: true,
        constraint_name: "collection_photos (OpenAPI required)",
        constraint_type: "PRIMARY KEY (inferred)",
        columns: ["collection_id", "photo_id"],
        detail:
          "OpenAPI marks collection_id and photo_id as the required key columns for collection_photos.",
      };
    }
    return {
      identity_model: "collection_id:photo_id",
      composite_unique_or_pk_found: covers ? true : false,
      constraint_name: covers ? "collection_photos (OpenAPI required)" : null,
      constraint_type: covers ? "PRIMARY KEY (inferred)" : null,
      columns: covers ? ["collection_id", "photo_id"] : required,
      detail: covers
        ? `OpenAPI required columns include collection_id and photo_id (${required.join(", ")}).`
        : `OpenAPI required columns for collection_photos: [${required.join(", ")}].`,
    };
  } catch (err) {
    return {
      ...base,
      detail: `OpenAPI threw: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
