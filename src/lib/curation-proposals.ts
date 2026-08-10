import { VALID_CURATION_DESTINATIONS } from "@/lib/curation";
import type { CurationPhoto } from "@/lib/curation";

export const PROPOSAL_SCHEMA_VERSION = 1;

export const EXPECTED_PROPOSAL_TOTALS = {
  decisions: 229,
  publish: 178,
  hold: 51,
  destinations: {
    "fatni-photography/nature": 38,
    "fatni-photography/urban": 34,
    "fatni-photography/astro": 11,
    "fatni-photography/street": 41,
    "fatni-photography/monochrome": 12,
    "ayoub-el-fatni/after-dark": 23,
    "ayoub-el-fatni/monochrome": 19,
  },
} as const;

export type ProposalPublication = "publish" | "hold";
export type ProposalApproval = "pending" | "approved" | "rejected";
export type ProposalConfidence = "high" | "medium" | "low";

export type ImportedProposalFields = {
  title: string;
  publication: ProposalPublication;
  site_id: string | null;
  collection_slug: string | null;
  sort_order: null;
  approval: ProposalApproval;
};

export type ImportedDecision = {
  photo_id: string;
  short_id?: string;
  storage_path?: string;
  current?: unknown;
  proposal: ImportedProposalFields;
  required_changes: string[];
  confidence: string;
  reason: string;
  related_photo_id: string | null;
  relationship: string | null;
};

export type ImportedProposalManifest = {
  schema_version: number;
  manifest_name?: string;
  generated_at?: string;
  review_basis?: unknown;
  governing_rules?: unknown;
  summary?: unknown;
  sequencing_note?: unknown;
  decisions: ImportedDecision[];
  [key: string]: unknown;
};

export type WorkingProposal = {
  title: string;
  publication: ProposalPublication;
  site_id: string | null;
  collection_slug: string | null;
  sort_order: null;
  approval: ProposalApproval;
};

export type WorkingDecision = {
  photo_id: string;
  original: ImportedDecision;
  proposal: WorkingProposal;
  reviewer_note: string;
};

export type ProposalFilter =
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "publish"
  | "hold"
  | "needs_title_change"
  | "needs_membership_change"
  | "related"
  | "confidence_high"
  | "confidence_medium"
  | "confidence_low";

const VALID_DEST_KEYS = new Set(
  VALID_CURATION_DESTINATIONS.map((d) => `${d.siteId}/${d.slug}`),
);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function destinationKey(
  siteId: string | null | undefined,
  slug: string | null | undefined,
): string | null {
  if (!siteId || !slug) return null;
  return `${siteId}/${slug}`;
}

export function isValidDestination(siteId: string, slug: string): boolean {
  return VALID_DEST_KEYS.has(`${siteId}/${slug}`);
}

export function validateProposalFields(
  proposal: WorkingProposal,
): string | null {
  const title = proposal.title.trim();
  if (!title) return "Proposed title is required.";

  if (proposal.publication === "hold") {
    if (proposal.site_id != null || proposal.collection_slug != null) {
      return "Hold requires site and collection to be empty.";
    }
    return null;
  }

  if (proposal.publication !== "publish") {
    return "Publication must be publish or hold.";
  }

  if (!proposal.site_id || !proposal.collection_slug) {
    return "Publish requires one site and one collection.";
  }

  if (!isValidDestination(proposal.site_id, proposal.collection_slug)) {
    return `Invalid destination ${proposal.site_id}/${proposal.collection_slug}.`;
  }

  // After Dark and Monochrome mutually exclusive is structural: one destination only.
  return null;
}

export type ManifestValidationResult =
  | {
      ok: true;
      manifest: ImportedProposalManifest;
      decisions: ImportedDecision[];
    }
  | { ok: false; errors: string[] };

export function parseAndValidateManifest(
  raw: unknown,
  livePhotoIds: ReadonlySet<string>,
): ManifestValidationResult {
  const errors: string[] = [];

  if (!isObject(raw)) {
    return { ok: false, errors: ["Manifest must be a JSON object."] };
  }

  const schemaVersion = raw.schema_version;
  if (schemaVersion !== PROPOSAL_SCHEMA_VERSION) {
    errors.push(
      `Unsupported schema_version ${String(schemaVersion)} (expected ${PROPOSAL_SCHEMA_VERSION}).`,
    );
  }

  if (!Array.isArray(raw.decisions)) {
    errors.push("Manifest must include a decisions array.");
    return { ok: false, errors };
  }

  if (raw.decisions.length !== EXPECTED_PROPOSAL_TOTALS.decisions) {
    errors.push(
      `Expected ${EXPECTED_PROPOSAL_TOTALS.decisions} decisions, found ${raw.decisions.length}.`,
    );
  }

  const decisions: ImportedDecision[] = [];
  const seen = new Set<string>();
  let publishCount = 0;
  let holdCount = 0;
  const destCounts: Record<string, number> = {};

  raw.decisions.forEach((row, index) => {
    const label = `Decision ${index + 1}`;
    if (!isObject(row)) {
      errors.push(`${label}: must be an object.`);
      return;
    }

    const photoId = asString(row.photo_id)?.trim() ?? "";
    if (!photoId) {
      errors.push(`${label}: missing photo_id.`);
      return;
    }
    if (seen.has(photoId)) {
      errors.push(`${label}: duplicate photo_id ${photoId}.`);
    }
    seen.add(photoId);

    if (!livePhotoIds.has(photoId)) {
      errors.push(`${label}: photo_id ${photoId} is not in the live library.`);
    }

    if (!isObject(row.proposal)) {
      errors.push(`${label}: missing proposal object.`);
      return;
    }

    const title = asString(row.proposal.title)?.trim() ?? "";
    if (!title) {
      errors.push(`${label}: proposal.title must be non-empty.`);
    }

    const publication = asString(row.proposal.publication);
    if (publication !== "publish" && publication !== "hold") {
      errors.push(`${label}: publication must be publish or hold.`);
      return;
    }

    const siteId = row.proposal.site_id == null ? null : asString(row.proposal.site_id);
    const collectionSlug =
      row.proposal.collection_slug == null
        ? null
        : asString(row.proposal.collection_slug);

    if (publication === "hold") {
      if (siteId != null || collectionSlug != null) {
        errors.push(`${label}: hold requires null site_id and collection_slug.`);
      }
      holdCount += 1;
    } else {
      if (!siteId || !collectionSlug) {
        errors.push(`${label}: publish requires site_id and collection_slug.`);
      } else if (!isValidDestination(siteId, collectionSlug)) {
        errors.push(
          `${label}: invalid destination ${siteId}/${collectionSlug}.`,
        );
      } else {
        const key = `${siteId}/${collectionSlug}`;
        destCounts[key] = (destCounts[key] ?? 0) + 1;
      }
      publishCount += 1;
    }

    const approval = asString(row.proposal.approval);
    if (approval !== "pending") {
      errors.push(`${label}: initial approval must be pending.`);
    }

    const requiredChanges = Array.isArray(row.required_changes)
      ? row.required_changes.filter((x): x is string => typeof x === "string")
      : [];

    decisions.push({
      photo_id: photoId,
      short_id: asString(row.short_id) ?? undefined,
      storage_path: asString(row.storage_path) ?? undefined,
      current: row.current,
      proposal: {
        title,
        publication,
        site_id: siteId,
        collection_slug: collectionSlug,
        sort_order: null,
        approval: "pending",
      },
      required_changes: requiredChanges,
      confidence: asString(row.confidence) ?? "medium",
      reason: asString(row.reason) ?? "",
      related_photo_id:
        row.related_photo_id == null ? null : asString(row.related_photo_id),
      relationship:
        row.relationship == null ? null : asString(row.relationship),
    });
  });

  if (publishCount !== EXPECTED_PROPOSAL_TOTALS.publish) {
    errors.push(
      `Expected ${EXPECTED_PROPOSAL_TOTALS.publish} publish decisions, found ${publishCount}.`,
    );
  }
  if (holdCount !== EXPECTED_PROPOSAL_TOTALS.hold) {
    errors.push(
      `Expected ${EXPECTED_PROPOSAL_TOTALS.hold} hold decisions, found ${holdCount}.`,
    );
  }

  for (const [key, expected] of Object.entries(
    EXPECTED_PROPOSAL_TOTALS.destinations,
  )) {
    const actual = destCounts[key] ?? 0;
    if (actual !== expected) {
      errors.push(`Expected ${expected} for ${key}, found ${actual}.`);
    }
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    manifest: raw as ImportedProposalManifest,
    decisions,
  };
}

export function createWorkingDecisions(
  decisions: ImportedDecision[],
): WorkingDecision[] {
  return decisions.map((original) => ({
    photo_id: original.photo_id,
    original,
    proposal: { ...original.proposal, sort_order: null },
    reviewer_note: "",
  }));
}

export function storageKeyForManifest(manifest: ImportedProposalManifest): string {
  const name = manifest.manifest_name ?? "unnamed";
  const generated = manifest.generated_at ?? "unknown";
  return `curation-proposals-v${PROPOSAL_SCHEMA_VERSION}:${name}:${generated}`;
}

export type PersistedProposalState = {
  version: number;
  storageKey: string;
  decisions: WorkingDecision[];
};

export function loadPersistedState(
  key: string,
): PersistedProposalState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedProposalState;
    if (
      parsed?.version !== PROPOSAL_SCHEMA_VERSION ||
      parsed.storageKey !== key ||
      !Array.isArray(parsed.decisions)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function savePersistedState(state: PersistedProposalState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(state.storageKey, JSON.stringify(state));
}

export function clearPersistedState(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export function needsTitleChange(
  photo: CurationPhoto,
  working: WorkingDecision,
): boolean {
  return photo.title.trim() !== working.proposal.title.trim();
}

export function needsMembershipChange(
  photo: CurationPhoto,
  working: WorkingDecision,
): boolean {
  if (working.proposal.publication === "hold") {
    return photo.membershipCount > 0;
  }
  if (photo.membershipCount !== 1) return true;
  const only = photo.memberships[0];
  return (
    only.siteId !== working.proposal.site_id ||
    only.slug !== working.proposal.collection_slug
  );
}

export function summarizeProposals(
  decisions: WorkingDecision[],
  photosById: Map<string, CurationPhoto>,
): {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
  publish: number;
  hold: number;
  needsTitleChange: number;
  needsMembershipChange: number;
  related: number;
  confidenceHigh: number;
  confidenceMedium: number;
  confidenceLow: number;
} {
  let needsTitleChangeCount = 0;
  let needsMembershipChangeCount = 0;
  for (const d of decisions) {
    const photo = photosById.get(d.photo_id);
    if (!photo) continue;
    if (needsTitleChange(photo, d)) needsTitleChangeCount += 1;
    if (needsMembershipChange(photo, d)) needsMembershipChangeCount += 1;
  }

  return {
    all: decisions.length,
    pending: decisions.filter((d) => d.proposal.approval === "pending").length,
    approved: decisions.filter((d) => d.proposal.approval === "approved").length,
    rejected: decisions.filter((d) => d.proposal.approval === "rejected").length,
    publish: decisions.filter((d) => d.proposal.publication === "publish")
      .length,
    hold: decisions.filter((d) => d.proposal.publication === "hold").length,
    needsTitleChange: needsTitleChangeCount,
    needsMembershipChange: needsMembershipChangeCount,
    related: decisions.filter((d) => Boolean(d.original.related_photo_id))
      .length,
    confidenceHigh: decisions.filter((d) => d.original.confidence === "high")
      .length,
    confidenceMedium: decisions.filter(
      (d) => d.original.confidence === "medium",
    ).length,
    confidenceLow: decisions.filter((d) => d.original.confidence === "low")
      .length,
  };
}

export function filterWorkingDecisions(
  decisions: WorkingDecision[],
  photosById: Map<string, CurationPhoto>,
  opts: {
    filter: ProposalFilter;
    siteId: string | null;
    collectionSlug: string | null;
  },
): WorkingDecision[] {
  return decisions.filter((d) => {
    const photo = photosById.get(d.photo_id);
    if (!photo) return false;

    if (opts.siteId && d.proposal.site_id !== opts.siteId) return false;
    if (
      opts.collectionSlug &&
      d.proposal.collection_slug !== opts.collectionSlug
    ) {
      return false;
    }

    switch (opts.filter) {
      case "all":
        return true;
      case "pending":
        return d.proposal.approval === "pending";
      case "approved":
        return d.proposal.approval === "approved";
      case "rejected":
        return d.proposal.approval === "rejected";
      case "publish":
        return d.proposal.publication === "publish";
      case "hold":
        return d.proposal.publication === "hold";
      case "needs_title_change":
        return needsTitleChange(photo, d);
      case "needs_membership_change":
        return needsMembershipChange(photo, d);
      case "related":
        return Boolean(d.original.related_photo_id);
      case "confidence_high":
        return d.original.confidence === "high";
      case "confidence_medium":
        return d.original.confidence === "medium";
      case "confidence_low":
        return d.original.confidence === "low";
      default:
        return true;
    }
  });
}

export function parseProposalFilter(
  value: string | null | undefined,
): ProposalFilter {
  switch (value) {
    case "pending":
    case "approved":
    case "rejected":
    case "publish":
    case "hold":
    case "needs_title_change":
    case "needs_membership_change":
    case "related":
    case "confidence_high":
    case "confidence_medium":
    case "confidence_low":
      return value;
    case "needs-title-change":
      return "needs_title_change";
    case "needs-membership-change":
      return "needs_membership_change";
    case "confidence-high":
      return "confidence_high";
    case "confidence-medium":
      return "confidence_medium";
    case "confidence-low":
      return "confidence_low";
    default:
      return "all";
  }
}

export function buildExportManifest(
  imported: ImportedProposalManifest,
  working: WorkingDecision[],
): ImportedProposalManifest {
  const byId = new Map(working.map((d) => [d.photo_id, d]));
  const decisions = imported.decisions.map((original) => {
    const w = byId.get(original.photo_id);
    if (!w) return original;
    return {
      ...original,
      proposal: {
        ...w.proposal,
        sort_order: null,
      },
      // Preserve provenance; attach reviewer note as non-destructive extra if present
      ...(w.reviewer_note.trim()
        ? { reviewer_note: w.reviewer_note.trim() }
        : {}),
    };
  });

  return {
    ...imported,
    decisions,
    exported_working_at: new Date().toISOString(),
  };
}

export function destinationLabel(
  siteId: string | null,
  slug: string | null,
): string {
  if (!siteId || !slug) return "Hold";
  const match = VALID_CURATION_DESTINATIONS.find(
    (d) => d.siteId === siteId && d.slug === slug,
  );
  if (match) return `${match.siteId === "fatni-photography" ? "Fatni" : "Ayoub"} · ${match.title}`;
  return `${siteId}/${slug}`;
}
