import { VALID_CURATION_DESTINATIONS } from "@/lib/curation";
import type { CurationPhoto } from "@/lib/curation";

export const PROPOSAL_SCHEMA_VERSION = 1;

export type ProposalPublication = "publish" | "hold";
export type ProposalApproval = "pending" | "approved" | "rejected";

export type ImportedProposalFields = {
  title: string;
  publication: ProposalPublication;
  site_id: string | null;
  collection_slug: string | null;
  sort_order: number | null;
  approval: ProposalApproval;
};

export type DecisionCurrentMembership = {
  site_id?: string;
  collection_slug?: string;
  sort_order?: number | null;
  retired?: boolean;
  raw?: string;
};

export type DecisionCurrent = {
  title?: string;
  memberships?: DecisionCurrentMembership[];
  flags?: unknown;
  [key: string]: unknown;
};

export type ImportedDecision = {
  photo_id: string;
  short_id?: string;
  storage_path?: string;
  current?: DecisionCurrent | unknown;
  proposal: ImportedProposalFields;
  required_changes: string[];
  confidence: string;
  reason: string;
  related_photo_id: string | null;
  relationship: string | null;
  reviewer_note?: string;
  original_reason?: string;
};

export type ImportedProposalManifest = {
  schema_version: number;
  manifest_name?: string;
  generated_at?: string;
  review_basis?: unknown;
  governing_rules?: unknown;
  summary?: ManifestSummary;
  sequencing?: unknown;
  sequencing_note?: unknown;
  decisions: ImportedDecision[];
  [key: string]: unknown;
};

export type ManifestSummary = {
  total: number;
  publish: number;
  hold: number;
  by_destination: Record<string, number>;
};

export type WorkingProposal = {
  title: string;
  publication: ProposalPublication;
  site_id: string | null;
  collection_slug: string | null;
  sort_order: number | null;
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

export type SequencingMode = "unsequenced" | "sequenced";

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

export async function sha256HexAsync(text: string): Promise<string> {
  return sha256HexFromBytes(new TextEncoder().encode(text));
}

export async function sha256HexFromBytes(
  bytes: ArrayBuffer | Uint8Array,
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("SHA-256 is unavailable in this environment.");
  }
  const view =
    bytes instanceof Uint8Array
      ? bytes
      : new Uint8Array(bytes);
  // Copy into a plain ArrayBuffer — required by SubtleCrypto typings / some runtimes.
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  const buf = await subtle.digest("SHA-256", copy.buffer);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Deterministic sync fingerprint for storage keys (not a cryptographic digest). */
export function fingerprintDecisions(decisions: ImportedDecision[]): string {
  const canonical = canonicalizeDecisionsForFingerprint(decisions);
  // FNV-1a 32-bit → hex (ES2017-safe)
  let hash = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export async function fingerprintDecisionsAsync(
  decisions: ImportedDecision[],
): Promise<string> {
  return sha256HexAsync(canonicalizeDecisionsForFingerprint(decisions));
}

export function canonicalizeDecisionsForFingerprint(
  decisions: ImportedDecision[],
): string {
  const rows = decisions
    .map((d) => ({
      photo_id: d.photo_id,
      title: d.proposal.title,
      publication: d.proposal.publication,
      site_id: d.proposal.site_id,
      collection_slug: d.proposal.collection_slug,
      sort_order: d.proposal.sort_order,
      approval: d.proposal.approval,
      related_photo_id: d.related_photo_id,
      relationship: d.relationship,
    }))
    .sort((a, b) => a.photo_id.localeCompare(b.photo_id));
  return JSON.stringify(rows);
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
    if (proposal.sort_order != null) {
      return "Hold requires sort_order to be null.";
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

  if (
    proposal.sort_order != null &&
    (!Number.isInteger(proposal.sort_order) || proposal.sort_order < 0)
  ) {
    return "sort_order must be null or a non-negative integer.";
  }

  return null;
}

export function deriveManifestSummary(
  decisions: Array<{ proposal: WorkingProposal | ImportedProposalFields }>,
): ManifestSummary {
  const by_destination: Record<string, number> = {};
  let publish = 0;
  let hold = 0;

  for (const d of decisions) {
    if (d.proposal.publication === "hold") {
      hold += 1;
      by_destination.hold = (by_destination.hold ?? 0) + 1;
      continue;
    }
    publish += 1;
    const key = destinationKey(d.proposal.site_id, d.proposal.collection_slug);
    if (key) by_destination[key] = (by_destination[key] ?? 0) + 1;
  }

  return {
    total: decisions.length,
    publish,
    hold,
    by_destination,
  };
}

function summariesEqual(a: ManifestSummary, b: ManifestSummary): string[] {
  const errors: string[] = [];
  if (a.total !== b.total) {
    errors.push(`summary.total mismatch: claimed ${a.total}, derived ${b.total}.`);
  }
  if (a.publish !== b.publish) {
    errors.push(
      `summary.publish mismatch: claimed ${a.publish}, derived ${b.publish}.`,
    );
  }
  if (a.hold !== b.hold) {
    errors.push(`summary.hold mismatch: claimed ${a.hold}, derived ${b.hold}.`);
  }
  const keys = new Set([
    ...Object.keys(a.by_destination ?? {}),
    ...Object.keys(b.by_destination ?? {}),
  ]);
  for (const key of keys) {
    const claimed = a.by_destination?.[key] ?? 0;
    const derived = b.by_destination?.[key] ?? 0;
    if (claimed !== derived) {
      errors.push(
        `summary.by_destination.${key} mismatch: claimed ${claimed}, derived ${derived}.`,
      );
    }
  }
  return errors;
}

function parseSortOrder(
  value: unknown,
  label: string,
  errors: string[],
): number | null | undefined {
  if (value === null) return null;
  if (value === undefined) return null;
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  errors.push(`${label}: sort_order must be null or a non-negative integer.`);
  return undefined;
}

function validateSequencing(
  decisions: ImportedDecision[],
  errors: string[],
): SequencingMode | null {
  const publish = decisions.filter((d) => d.proposal.publication === "publish");
  const nullCount = publish.filter((d) => d.proposal.sort_order == null).length;
  const intCount = publish.filter(
    (d) =>
      typeof d.proposal.sort_order === "number" &&
      Number.isInteger(d.proposal.sort_order),
  ).length;

  if (publish.length === 0) return "unsequenced";

  if (nullCount === publish.length) return "unsequenced";
  if (intCount === publish.length) {
    const byDest = new Map<string, number[]>();
    for (const d of publish) {
      const key = destinationKey(d.proposal.site_id, d.proposal.collection_slug);
      if (!key) continue;
      const list = byDest.get(key) ?? [];
      list.push(d.proposal.sort_order as number);
      byDest.set(key, list);
    }
    for (const [key, orders] of byDest) {
      const sorted = [...orders].sort((a, b) => a - b);
      const uniq = new Set(sorted);
      if (uniq.size !== sorted.length) {
        errors.push(`Destination ${key}: duplicate sort_order values.`);
        continue;
      }
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] !== i) {
          errors.push(
            `Destination ${key}: sort_order must be contiguous 0..${sorted.length - 1} (gap or start error at ${sorted[i]}).`,
          );
          break;
        }
      }
    }
    return "sequenced";
  }

  errors.push(
    "Mixed sequencing: published decisions must be all null sort_order or all non-negative integers.",
  );
  return null;
}

export type ManifestValidationResult =
  | {
      ok: true;
      manifest: ImportedProposalManifest;
      decisions: ImportedDecision[];
      sequencingMode: SequencingMode;
      contentFingerprint: string;
    }
  | { ok: false; errors: string[] };

export function parseAndValidateManifest(
  raw: unknown,
  livePhotoIds: ReadonlySet<string>,
  options?: { contentFingerprint?: string },
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

  const decisions: ImportedDecision[] = [];
  const seen = new Set<string>();

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

    const siteId =
      row.proposal.site_id == null ? null : asString(row.proposal.site_id);
    const collectionSlug =
      row.proposal.collection_slug == null
        ? null
        : asString(row.proposal.collection_slug);

    const sortOrder = parseSortOrder(row.proposal.sort_order, label, errors);
    if (sortOrder === undefined) return;

    const approvalRaw = asString(row.proposal.approval);
    if (
      approvalRaw !== "pending" &&
      approvalRaw !== "approved" &&
      approvalRaw !== "rejected"
    ) {
      errors.push(`${label}: approval must be pending, approved, or rejected.`);
      return;
    }
    const approval = approvalRaw;

    if (publication === "hold") {
      if (siteId != null || collectionSlug != null) {
        errors.push(`${label}: hold requires null site_id and collection_slug.`);
      }
      if (sortOrder != null) {
        errors.push(`${label}: hold requires null sort_order.`);
      }
    } else if (!siteId || !collectionSlug) {
      errors.push(`${label}: publish requires site_id and collection_slug.`);
    } else if (!isValidDestination(siteId, collectionSlug)) {
      errors.push(`${label}: invalid destination ${siteId}/${collectionSlug}.`);
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
        sort_order: sortOrder,
        approval,
      },
      required_changes: requiredChanges,
      confidence: asString(row.confidence) ?? "medium",
      reason: asString(row.reason) ?? "",
      related_photo_id:
        row.related_photo_id == null ? null : asString(row.related_photo_id),
      relationship:
        row.relationship == null ? null : asString(row.relationship),
      ...(typeof row.reviewer_note === "string"
        ? { reviewer_note: row.reviewer_note }
        : {}),
      ...(typeof row.original_reason === "string"
        ? { original_reason: row.original_reason }
        : {}),
    });
  });

  const sequencingMode = validateSequencing(decisions, errors);
  const derived = deriveManifestSummary(decisions);

  if (isObject(raw.summary)) {
    const claimed: ManifestSummary = {
      total: Number(raw.summary.total),
      publish: Number(raw.summary.publish),
      hold: Number(raw.summary.hold),
      by_destination: isObject(raw.summary.by_destination)
        ? Object.fromEntries(
            Object.entries(raw.summary.by_destination).map(([k, v]) => [
              k,
              Number(v),
            ]),
          )
        : {},
    };
    errors.push(...summariesEqual(claimed, derived));
  }

  if (errors.length || !sequencingMode) {
    return { ok: false, errors };
  }

  const contentFingerprint =
    options?.contentFingerprint ?? fingerprintDecisions(decisions);

  const manifest: ImportedProposalManifest = {
    ...(raw as ImportedProposalManifest),
    schema_version: PROPOSAL_SCHEMA_VERSION,
    decisions,
    summary: derived,
  };

  return {
    ok: true,
    manifest,
    decisions,
    sequencingMode,
    contentFingerprint,
  };
}

export function createWorkingDecisions(
  decisions: ImportedDecision[],
): WorkingDecision[] {
  return decisions.map((original) => ({
    photo_id: original.photo_id,
    original,
    proposal: { ...original.proposal },
    reviewer_note:
      typeof original.reviewer_note === "string" ? original.reviewer_note : "",
  }));
}

export function storageKeyForManifest(
  manifest: ImportedProposalManifest,
  contentFingerprint: string,
): string {
  const name = manifest.manifest_name ?? "unnamed";
  const generated = manifest.generated_at ?? "unknown";
  return `curation-proposals-v${PROPOSAL_SCHEMA_VERSION}:${name}:${generated}:${contentFingerprint.slice(0, 16)}`;
}

export type PersistedProposalState = {
  version: number;
  storageKey: string;
  contentFingerprint: string;
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
    approved: decisions.filter((d) => d.proposal.approval === "approved")
      .length,
    rejected: decisions.filter((d) => d.proposal.approval === "rejected")
      .length,
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
  const filtered = decisions.filter((d) => {
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

  const singleSequencedCollection =
    Boolean(opts.siteId) &&
    Boolean(opts.collectionSlug) &&
    filtered.length > 0 &&
    filtered.every(
      (d) =>
        d.proposal.publication === "publish" &&
        typeof d.proposal.sort_order === "number",
    );

  if (singleSequencedCollection) {
    return [...filtered].sort(
      (a, b) => (a.proposal.sort_order ?? 0) - (b.proposal.sort_order ?? 0),
    );
  }

  return filtered;
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

function asCurrent(value: unknown): DecisionCurrent {
  if (!isObject(value)) return {};
  return value as DecisionCurrent;
}

export function recomputeRequiredChanges(
  current: unknown,
  proposal: WorkingProposal,
): string[] {
  const cur = asCurrent(current);
  const changes: string[] = [];
  const currentTitle = String(cur.title ?? "").trim();
  if (proposal.title.trim() !== currentTitle) {
    changes.push("set_display_title");
  }

  const memberships = Array.isArray(cur.memberships) ? cur.memberships : [];

  if (proposal.publication === "hold") {
    if (memberships.length > 0) {
      changes.push("remove_all_collection_memberships");
    }
    return changes;
  }

  const exactOne =
    memberships.length === 1 &&
    memberships[0]?.site_id === proposal.site_id &&
    memberships[0]?.collection_slug === proposal.collection_slug;

  if (!exactOne) {
    changes.push("replace_with_single_collection_membership");
  } else if (
    proposal.sort_order != null &&
    memberships[0]?.sort_order !== proposal.sort_order
  ) {
    changes.push("update_collection_sort_order");
  }

  return changes;
}

function destinationChanged(
  original: ImportedDecision,
  proposal: WorkingProposal,
): boolean {
  return (
    original.proposal.publication !== proposal.publication ||
    original.proposal.site_id !== proposal.site_id ||
    original.proposal.collection_slug !== proposal.collection_slug
  );
}

function exportReason(
  original: ImportedDecision,
  proposal: WorkingProposal,
  reviewerNote: string,
): { reason: string; original_reason?: string } {
  if (!destinationChanged(original, proposal)) {
    return { reason: original.reason };
  }
  const preserved = original.original_reason ?? original.reason;
  if (reviewerNote.trim()) {
    return {
      reason: reviewerNote.trim(),
      original_reason: preserved,
    };
  }
  return {
    reason: "Reviewer-adjusted destination during local proposal review.",
    original_reason: preserved,
  };
}

export function buildExportManifest(
  imported: ImportedProposalManifest,
  working: WorkingDecision[],
): ImportedProposalManifest {
  const byId = new Map(working.map((d) => [d.photo_id, d]));
  const decisions: ImportedDecision[] = imported.decisions.map((original) => {
    const w = byId.get(original.photo_id);
    if (!w) return original;
    const { reason, original_reason } = exportReason(
      original,
      w.proposal,
      w.reviewer_note,
    );
    return {
      ...original,
      proposal: { ...w.proposal },
      required_changes: recomputeRequiredChanges(original.current, w.proposal),
      reason,
      related_photo_id: original.related_photo_id,
      relationship: original.relationship,
      ...(w.reviewer_note.trim()
        ? { reviewer_note: w.reviewer_note.trim() }
        : {}),
      ...(original_reason ? { original_reason } : {}),
    };
  });

  const summary = deriveManifestSummary(decisions);

  const exported: ImportedProposalManifest = {
    schema_version: imported.schema_version,
    manifest_name: imported.manifest_name,
    generated_at: imported.generated_at,
    summary,
    decisions,
    exported_working_at: new Date().toISOString(),
  };

  if (imported.review_basis !== undefined) {
    exported.review_basis = imported.review_basis;
  }
  if (imported.governing_rules !== undefined) {
    exported.governing_rules = imported.governing_rules;
  }
  if (imported.sequencing !== undefined) {
    exported.sequencing = imported.sequencing;
  }
  if (imported.sequencing_note !== undefined) {
    exported.sequencing_note = imported.sequencing_note;
  }

  return exported;
}

export function destinationLabel(
  siteId: string | null,
  slug: string | null,
): string {
  if (!siteId || !slug) return "Hold";
  const match = VALID_CURATION_DESTINATIONS.find(
    (d) => d.siteId === siteId && d.slug === slug,
  );
  if (match) {
    return `${match.siteId === "fatni-photography" ? "Fatni" : "Ayoub"} · ${match.title}`;
  }
  return `${siteId}/${slug}`;
}

export function proposedPositionLabel(
  decision: WorkingDecision,
  filtered: WorkingDecision[],
): string | null {
  if (typeof decision.proposal.sort_order !== "number") return null;
  if (
    !filtered.every(
      (d) =>
        d.proposal.publication === "publish" &&
        typeof d.proposal.sort_order === "number" &&
        d.proposal.site_id === decision.proposal.site_id &&
        d.proposal.collection_slug === decision.proposal.collection_slug,
    )
  ) {
    return null;
  }
  return `${decision.proposal.sort_order + 1} / ${filtered.length}`;
}
