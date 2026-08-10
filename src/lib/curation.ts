import { AYOUB_SITE_ID, FATNI_SITE_ID } from "@/lib/site";

/** Valid public destinations for future curation (Phase 1: documentation only). */
export const VALID_CURATION_DESTINATIONS = [
  { siteId: FATNI_SITE_ID, slug: "nature", title: "Nature" },
  { siteId: FATNI_SITE_ID, slug: "urban", title: "Urban" },
  { siteId: FATNI_SITE_ID, slug: "astro", title: "Astro" },
  { siteId: FATNI_SITE_ID, slug: "street", title: "Street" },
  { siteId: FATNI_SITE_ID, slug: "monochrome", title: "Monochrome" },
  { siteId: AYOUB_SITE_ID, slug: "after-dark", title: "After Dark" },
  { siteId: AYOUB_SITE_ID, slug: "monochrome", title: "Monochrome" },
] as const;

/** Retired collections — still audited, never offered as destinations. */
export const RETIRED_COLLECTIONS = [
  { siteId: FATNI_SITE_ID, slug: "after-dark", title: "After Dark" },
  { siteId: AYOUB_SITE_ID, slug: "selected-work", title: "Selected Work" },
] as const;

export type AllocationState = "unassigned" | "assigned_once" | "duplicate";

export type CurationFilter =
  | "all"
  | "unassigned"
  | "assigned_once"
  | "duplicate"
  | "cross_site"
  | "retired"
  | "needs_title";

export type CurationMembership = {
  collectionId: string;
  siteId: string;
  slug: string;
  title: string;
  sortOrder: number;
  retired: boolean;
};

export type CurationPhoto = {
  id: string;
  shortRef: string;
  title: string;
  storagePath: string;
  publicUrl: string;
  createdAt: string | null;
  displayScale: number;
  /** Legacy diagnostic only — not allocation truth. */
  legacyCategories: string[];
  legacySortOrder: number | null;
  memberships: CurationMembership[];
  membershipCount: number;
  allocationState: AllocationState;
  crossSiteDuplicate: boolean;
  retiredMembership: boolean;
  needsTitle: boolean;
};

export type CurationManifestEntry = {
  photo_id: string;
  current_title: string;
  storage_path: string;
  public_url: string;
  created_at: string | null;
  display_scale: number;
  memberships: {
    site_id: string;
    collection_id: string;
    collection_slug: string;
    collection_title: string;
    sort_order: number;
    retired: boolean;
  }[];
  allocation_state: AllocationState;
  cross_site_duplicate: boolean;
  retired_membership: boolean;
  needs_title: boolean;
};

export type CurationSummary = {
  all: number;
  unassigned: number;
  assignedOnce: number;
  duplicate: number;
  crossSiteDuplicate: number;
  retired: number;
  needsTitle: number;
};

export function isRetiredCollection(siteId: string, slug: string): boolean {
  return RETIRED_COLLECTIONS.some((c) => c.siteId === siteId && c.slug === slug);
}

/** Stable short reference: first 8 hex chars of the UUID (no hyphens). */
export function shortRefFromId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toLowerCase();
}

/**
 * Filename-like or numeric titles that still need a human title.
 * Conservative: UUID blobs, camera stems, DSC/A730 codes, hex dumps, bare numbers.
 */
export function needsTitleHeuristic(title: string): boolean {
  const t = title.trim();
  if (!t) return true;

  const compact = t.replace(/\s+/g, " ");
  const noSpace = compact.replace(/\s/g, "");
  const lower = compact.toLowerCase();

  // Bare / mostly numeric
  if (/^\d[\d\s._-]*$/.test(compact)) return true;

  // UUID (with or without hyphens / spaces)
  if (
    /^[0-9a-f]{8}[- ]?[0-9a-f]{4}[- ]?[0-9a-f]{4}[- ]?[0-9a-f]{4}[- ]?[0-9a-f]{12}$/i.test(
      compact,
    )
  ) {
    return true;
  }
  // Hex blob with spaces (common upload default from phone filenames)
  if (/^[0-9a-f]{8}([ -][0-9a-f]{4}){3}([ -][0-9a-f]{4,12})+/i.test(compact)) {
    return true;
  }
  if (/^[0-9a-f]{20,}$/i.test(noSpace) && /[0-9]/.test(noSpace) && /[a-f]/i.test(noSpace)) {
    return true;
  }

  // Camera / export stems
  if (/^(dsc|img|dji|a\d{3}|_a\d{3}|img_|dsc_)\s*\d/i.test(lower)) return true;
  if (/^dsc\s?\d+/i.test(lower)) return true;
  if (/^a730\d+/i.test(noSpace)) return true;
  if (/\b(nik|dxo|hdr|edit|modifier|denoiseai)\b/i.test(lower) && /\d{3,}/.test(lower)) {
    return true;
  }

  // Looks like a file stem: long token with extension residue or hash
  if (/\.(jpe?g|png|webp|heic)$/i.test(lower)) return true;
  if (/^[0-9a-f]{8,}[-_][0-9a-f-]{8,}/i.test(noSpace)) return true;

  return false;
}

export function deriveAllocationState(membershipCount: number): AllocationState {
  if (membershipCount <= 0) return "unassigned";
  if (membershipCount === 1) return "assigned_once";
  return "duplicate";
}

export function buildCurationPhoto(input: {
  id: string;
  title: string;
  storagePath: string;
  publicUrl: string;
  createdAt: string | null;
  displayScale: number | null;
  legacyCategories: string[] | null;
  legacySortOrder: number | null;
  memberships: Omit<CurationMembership, "retired">[];
}): CurationPhoto {
  const memberships: CurationMembership[] = input.memberships.map((m) => ({
    ...m,
    retired: isRetiredCollection(m.siteId, m.slug),
  }));
  memberships.sort((a, b) => {
    if (a.siteId !== b.siteId) return a.siteId.localeCompare(b.siteId);
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.title.localeCompare(b.title);
  });

  const siteIds = new Set(memberships.map((m) => m.siteId));
  const membershipCount = memberships.length;

  return {
    id: input.id,
    shortRef: shortRefFromId(input.id),
    title: input.title,
    storagePath: input.storagePath,
    publicUrl: input.publicUrl,
    createdAt: input.createdAt,
    displayScale: input.displayScale ?? 1,
    legacyCategories: input.legacyCategories ?? [],
    legacySortOrder: input.legacySortOrder,
    memberships,
    membershipCount,
    allocationState: deriveAllocationState(membershipCount),
    crossSiteDuplicate: membershipCount > 1 && siteIds.size > 1,
    retiredMembership: memberships.some((m) => m.retired),
    needsTitle: needsTitleHeuristic(input.title),
  };
}

export function summarizeCuration(photos: CurationPhoto[]): CurationSummary {
  return {
    all: photos.length,
    unassigned: photos.filter((p) => p.allocationState === "unassigned").length,
    assignedOnce: photos.filter((p) => p.allocationState === "assigned_once")
      .length,
    duplicate: photos.filter((p) => p.allocationState === "duplicate").length,
    crossSiteDuplicate: photos.filter((p) => p.crossSiteDuplicate).length,
    retired: photos.filter((p) => p.retiredMembership).length,
    needsTitle: photos.filter((p) => p.needsTitle).length,
  };
}

export function filterCurationPhotos(
  photos: CurationPhoto[],
  opts: {
    filter: CurationFilter;
    siteId: string | null;
    collectionId: string | null;
  },
): CurationPhoto[] {
  return photos.filter((photo) => {
    if (opts.siteId) {
      if (!photo.memberships.some((m) => m.siteId === opts.siteId)) return false;
    }
    if (opts.collectionId) {
      if (!photo.memberships.some((m) => m.collectionId === opts.collectionId)) {
        return false;
      }
    }

    switch (opts.filter) {
      case "all":
        return true;
      case "unassigned":
        return photo.allocationState === "unassigned";
      case "assigned_once":
        return photo.allocationState === "assigned_once";
      case "duplicate":
        return photo.allocationState === "duplicate";
      case "cross_site":
        return photo.crossSiteDuplicate;
      case "retired":
        return photo.retiredMembership;
      case "needs_title":
        return photo.needsTitle;
      default:
        return true;
    }
  });
}

export function toManifestEntry(photo: CurationPhoto): CurationManifestEntry {
  return {
    photo_id: photo.id,
    current_title: photo.title,
    storage_path: photo.storagePath,
    public_url: photo.publicUrl,
    created_at: photo.createdAt,
    display_scale: photo.displayScale,
    memberships: photo.memberships.map((m) => ({
      site_id: m.siteId,
      collection_id: m.collectionId,
      collection_slug: m.slug,
      collection_title: m.title,
      sort_order: m.sortOrder,
      retired: m.retired,
    })),
    allocation_state: photo.allocationState,
    cross_site_duplicate: photo.crossSiteDuplicate,
    retired_membership: photo.retiredMembership,
    needs_title: photo.needsTitle,
  };
}

export function parseCurationFilter(value: string | null | undefined): CurationFilter {
  const normalized = (value ?? "").trim().toLowerCase().replace(/-/g, "_");
  switch (normalized) {
    case "unassigned":
    case "assigned_once":
    case "duplicate":
    case "cross_site":
    case "retired":
    case "needs_title":
      return normalized;
    default:
      return "all";
  }
}
