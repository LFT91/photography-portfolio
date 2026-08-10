import { VALID_CURATION_DESTINATIONS } from "@/lib/curation";
import type {
  ImportedDecision,
  ImportedProposalManifest,
  WorkingDecision,
} from "@/lib/curation-proposals";
import {
  destinationKey,
  deriveManifestSummary,
  parseAndValidateManifest,
} from "@/lib/curation-proposals";

export type DryRunLivePhoto = {
  id: string;
  title: string;
  storage_path: string;
};

export type DryRunLiveMembership = {
  id: string;
  photo_id: string;
  collection_id: string;
  sort_order: number;
  collection: {
    id: string;
    title: string;
    slug: string;
    site_id: string;
  };
};

export type DryRunLiveCollection = {
  id: string;
  site_id: string;
  title: string;
  slug: string;
};

export type DryRunLiveSnapshot = {
  photos: DryRunLivePhoto[];
  memberships: DryRunLiveMembership[];
  collections: DryRunLiveCollection[];
};

export type DryRunTitleUpdate = {
  photo_id: string;
  old_title: string;
  new_title: string;
};

export type DryRunMembershipRetain = {
  membership_id: string;
  photo_id: string;
  collection_id: string;
  final_sort_order: number;
};

export type DryRunMembershipDelete = {
  membership_id: string;
  photo_id: string;
  collection_id: string;
  reason: string;
};

export type DryRunMembershipInsert = {
  photo_id: string;
  collection_id: string;
  final_sort_order: number;
  site_id: string;
  collection_slug: string;
};

export type DryRunSortOrderUpdate = {
  membership_id: string;
  photo_id: string;
  collection_id: string;
  from_sort_order: number;
  to_sort_order: number;
};

export type DryRunPhotoRecord = {
  photo_id: string;
  storage_path: string;
  before: {
    title: string;
    memberships: {
      membership_id: string;
      collection_id: string;
      site_id: string;
      slug: string;
      sort_order: number;
    }[];
  };
  after: {
    title: string;
    publication: "publish" | "hold";
    site_id: string | null;
    collection_slug: string | null;
    collection_id: string | null;
    sort_order: number | null;
  };
};

export type CurationDryRunReport = {
  generated_at: string;
  manifest_sha256: string;
  executable: false;
  source: {
    live_photo_count: number;
    live_membership_count: number;
    manifest_decision_count: number;
    related_duplicate_variant: number;
  };
  drift_checks: { name: string; ok: boolean; detail: string }[];
  final_counts: {
    published_photos: number;
    hold_photos: number;
    membership_rows: number;
    by_destination: Record<string, number>;
  };
  title_updates: DryRunTitleUpdate[];
  membership_retains: DryRunMembershipRetain[];
  membership_deletes: DryRunMembershipDelete[];
  membership_inserts: DryRunMembershipInsert[];
  sort_order_updates: DryRunSortOrderUpdate[];
  retained_already_at_final_order: number;
  photo_records: DryRunPhotoRecord[];
  invariants: { name: string; ok: boolean; detail: string }[];
  pass: boolean;
  errors: string[];
};

function resolveDestinations(
  collections: DryRunLiveCollection[],
): { ok: true; map: Map<string, DryRunLiveCollection> } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const map = new Map<string, DryRunLiveCollection>();
  for (const dest of VALID_CURATION_DESTINATIONS) {
    const key = `${dest.siteId}/${dest.slug}`;
    const matches = collections.filter(
      (c) => c.site_id === dest.siteId && c.slug === dest.slug,
    );
    if (matches.length !== 1) {
      errors.push(
        `Destination ${key} resolves to ${matches.length} collections (need exactly 1).`,
      );
      continue;
    }
    map.set(key, matches[0]);
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, map };
}

/**
 * Pure read-only planner. Never mutates anything.
 */
export function planCurationDryRun(input: {
  manifest: ImportedProposalManifest;
  workingDecisions: WorkingDecision[];
  live: DryRunLiveSnapshot;
  manifestSha256: string;
  generatedAt?: string;
}): CurationDryRunReport {
  const errors: string[] = [];
  const drift_checks: CurationDryRunReport["drift_checks"] = [];
  const invariants: CurationDryRunReport["invariants"] = [];

  const livePhotoCount = input.live.photos.length;
  const liveMembershipCount = input.live.memberships.length;
  drift_checks.push({
    name: "live_photo_count_229",
    ok: livePhotoCount === 229,
    detail: `live photos=${livePhotoCount}`,
  });
  drift_checks.push({
    name: "live_membership_count_204",
    ok: liveMembershipCount === 204,
    detail: `live memberships=${liveMembershipCount}`,
  });
  if (livePhotoCount !== 229) {
    errors.push(`Live photo count is ${livePhotoCount}, expected 229.`);
  }
  if (liveMembershipCount !== 204) {
    errors.push(`Live membership count is ${liveMembershipCount}, expected 204.`);
  }

  const liveIds = new Set(input.live.photos.map((p) => p.id));
  const manifestIds = new Set(input.workingDecisions.map((d) => d.photo_id));
  const idsMatch =
    liveIds.size === 229 &&
    manifestIds.size === 229 &&
    [...liveIds].every((id) => manifestIds.has(id));
  drift_checks.push({
    name: "manifest_ids_equal_live_ids",
    ok: idsMatch,
    detail: `live=${liveIds.size} manifest=${manifestIds.size}`,
  });
  if (!idsMatch) {
    errors.push("Manifest photo IDs do not equal live photo IDs one-for-one.");
  }

  const photoById = new Map(input.live.photos.map((p) => [p.id, p]));
  for (const d of input.workingDecisions) {
    const live = photoById.get(d.photo_id);
    const path = d.original.storage_path;
    if (live && path && live.storage_path !== path) {
      errors.push(
        `Storage path mismatch for ${d.photo_id}: live=${live.storage_path} manifest=${path}`,
      );
    }
  }
  drift_checks.push({
    name: "storage_paths_match",
    ok: !errors.some((e) => e.includes("Storage path mismatch")),
    detail: "Compared manifest storage_path to live photos.storage_path where present.",
  });

  const validation = parseAndValidateManifest(
    {
      ...input.manifest,
      decisions: input.workingDecisions.map((w) => ({
        ...w.original,
        proposal: w.proposal,
        reviewer_note: w.reviewer_note || undefined,
      })),
    },
    liveIds,
  );
  if (!validation.ok) {
    errors.push(...validation.errors);
  }
  drift_checks.push({
    name: "manifest_validation",
    ok: validation.ok,
    detail: validation.ok
      ? `sequencing=${validation.sequencingMode}`
      : validation.errors.slice(0, 3).join("; "),
  });

  const destResolved = resolveDestinations(input.live.collections);
  if (!destResolved.ok) {
    errors.push(...destResolved.errors);
  }
  drift_checks.push({
    name: "destinations_resolve_uniquely",
    ok: destResolved.ok,
    detail: destResolved.ok
      ? `${destResolved.map.size} destinations`
      : destResolved.errors.join("; "),
  });

  for (const m of input.live.memberships) {
    if (!m.id) {
      errors.push(
        `Membership row missing stable ID for photo ${m.photo_id} / collection ${m.collection_id}.`,
      );
    }
  }
  drift_checks.push({
    name: "membership_rows_have_ids",
    ok: input.live.memberships.every((m) => Boolean(m.id)),
    detail: "Every collection_photos row must expose id.",
  });

  const title_updates: DryRunTitleUpdate[] = [];
  const membership_retains: DryRunMembershipRetain[] = [];
  const membership_deletes: DryRunMembershipDelete[] = [];
  const membership_inserts: DryRunMembershipInsert[] = [];
  const sort_order_updates: DryRunSortOrderUpdate[] = [];
  let retained_already_at_final_order = 0;
  const photo_records: DryRunPhotoRecord[] = [];

  const membershipsByPhoto = new Map<string, DryRunLiveMembership[]>();
  for (const m of input.live.memberships) {
    const list = membershipsByPhoto.get(m.photo_id) ?? [];
    list.push(m);
    membershipsByPhoto.set(m.photo_id, list);
  }

  const finalMembershipKeys = new Set<string>();

  if (destResolved.ok && validation.ok && errors.length === 0) {
    for (const w of input.workingDecisions) {
      const live = photoById.get(w.photo_id);
      if (!live) continue;
      const beforeMemberships = membershipsByPhoto.get(w.photo_id) ?? [];

      if (live.title.trim() !== w.proposal.title.trim()) {
        title_updates.push({
          photo_id: w.photo_id,
          old_title: live.title,
          new_title: w.proposal.title,
        });
      }

      if (w.proposal.publication === "hold") {
        for (const m of beforeMemberships) {
          membership_deletes.push({
            membership_id: m.id,
            photo_id: w.photo_id,
            collection_id: m.collection_id,
            reason: "hold_remove_all_memberships",
          });
        }
        photo_records.push({
          photo_id: w.photo_id,
          storage_path: live.storage_path,
          before: {
            title: live.title,
            memberships: beforeMemberships.map((m) => ({
              membership_id: m.id,
              collection_id: m.collection_id,
              site_id: m.collection.site_id,
              slug: m.collection.slug,
              sort_order: m.sort_order,
            })),
          },
          after: {
            title: w.proposal.title,
            publication: "hold",
            site_id: null,
            collection_slug: null,
            collection_id: null,
            sort_order: null,
          },
        });
        continue;
      }

      const key = destinationKey(w.proposal.site_id, w.proposal.collection_slug);
      if (!key || w.proposal.sort_order == null) {
        errors.push(
          `Publish decision ${w.photo_id} missing sequenced destination/order.`,
        );
        continue;
      }
      const dest = destResolved.map.get(key);
      if (!dest) {
        errors.push(`Could not resolve destination ${key} for ${w.photo_id}.`);
        continue;
      }

      const finalKey = `${w.photo_id}::${dest.id}`;
      if (finalMembershipKeys.has(finalKey)) {
        errors.push(`Duplicate final membership for ${w.photo_id}.`);
      }
      finalMembershipKeys.add(finalKey);

      const matching = beforeMemberships.filter(
        (m) => m.collection_id === dest.id,
      );
      const others = beforeMemberships.filter((m) => m.collection_id !== dest.id);

      for (const m of others) {
        membership_deletes.push({
          membership_id: m.id,
          photo_id: w.photo_id,
          collection_id: m.collection_id,
          reason: "replace_with_single_collection_membership",
        });
      }

      if (matching.length === 1) {
        const row = matching[0];
        membership_retains.push({
          membership_id: row.id,
          photo_id: w.photo_id,
          collection_id: dest.id,
          final_sort_order: w.proposal.sort_order,
        });
        if (row.sort_order !== w.proposal.sort_order) {
          sort_order_updates.push({
            membership_id: row.id,
            photo_id: w.photo_id,
            collection_id: dest.id,
            from_sort_order: row.sort_order,
            to_sort_order: w.proposal.sort_order,
          });
        } else {
          retained_already_at_final_order += 1;
        }
      } else if (matching.length === 0) {
        membership_inserts.push({
          photo_id: w.photo_id,
          collection_id: dest.id,
          final_sort_order: w.proposal.sort_order,
          site_id: dest.site_id,
          collection_slug: dest.slug,
        });
      } else {
        // Ambiguous duplicate memberships to same collection — delete extras, retain one
        const [keep, ...dupes] = matching;
        membership_retains.push({
          membership_id: keep.id,
          photo_id: w.photo_id,
          collection_id: dest.id,
          final_sort_order: w.proposal.sort_order,
        });
        if (keep.sort_order !== w.proposal.sort_order) {
          sort_order_updates.push({
            membership_id: keep.id,
            photo_id: w.photo_id,
            collection_id: dest.id,
            from_sort_order: keep.sort_order,
            to_sort_order: w.proposal.sort_order,
          });
        } else {
          retained_already_at_final_order += 1;
        }
        for (const m of dupes) {
          membership_deletes.push({
            membership_id: m.id,
            photo_id: w.photo_id,
            collection_id: m.collection_id,
            reason: "duplicate_membership_same_collection",
          });
        }
      }

      photo_records.push({
        photo_id: w.photo_id,
        storage_path: live.storage_path,
        before: {
          title: live.title,
          memberships: beforeMemberships.map((m) => ({
            membership_id: m.id,
            collection_id: m.collection_id,
            site_id: m.collection.site_id,
            slug: m.collection.slug,
            sort_order: m.sort_order,
          })),
        },
        after: {
          title: w.proposal.title,
          publication: "publish",
          site_id: w.proposal.site_id,
          collection_slug: w.proposal.collection_slug,
          collection_id: dest.id,
          sort_order: w.proposal.sort_order,
        },
      });
    }
  }

  const summary = deriveManifestSummary(input.workingDecisions);
  const finalMembershipRows =
    membership_retains.length + membership_inserts.length;
  const equationOk =
    liveMembershipCount - membership_deletes.length + membership_inserts.length ===
    finalMembershipRows;

  invariants.push({
    name: "one_photo_one_membership_or_hold",
    ok:
      summary.publish === finalMembershipRows &&
      summary.hold ===
        input.workingDecisions.filter((d) => d.proposal.publication === "hold")
          .length &&
      finalMembershipKeys.size === summary.publish,
    detail: `publish=${summary.publish} final_rows=${finalMembershipRows}`,
  });
  invariants.push({
    name: "reconciliation_equation",
    ok: equationOk,
    detail: `${liveMembershipCount} - ${membership_deletes.length} + ${membership_inserts.length} = ${finalMembershipRows}`,
  });
  invariants.push({
    name: "collection_orders_contiguous",
    ok: validation.ok && validation.sequencingMode === "sequenced",
    detail: validation.ok
      ? validation.sequencingMode
      : "manifest sequencing invalid",
  });

  if (!equationOk) {
    errors.push(
      `Reconciliation equation failed: ${liveMembershipCount} - ${membership_deletes.length} + ${membership_inserts.length} !== ${finalMembershipRows}`,
    );
  }

  const related = input.workingDecisions.filter((d) =>
    Boolean(d.original.related_photo_id),
  ).length;

  const pass =
    errors.length === 0 &&
    drift_checks.every((c) => c.ok) &&
    invariants.every((i) => i.ok);

  const report: CurationDryRunReport = {
    generated_at: input.generatedAt ?? new Date().toISOString(),
    manifest_sha256: input.manifestSha256,
    executable: false,
    source: {
      live_photo_count: livePhotoCount,
      live_membership_count: liveMembershipCount,
      manifest_decision_count: input.workingDecisions.length,
      related_duplicate_variant: related,
    },
    drift_checks,
    final_counts: {
      published_photos: summary.publish,
      hold_photos: summary.hold,
      membership_rows: finalMembershipRows,
      by_destination: Object.fromEntries(
        Object.entries(summary.by_destination).filter(([k]) => k !== "hold"),
      ),
    },
    title_updates,
    membership_retains,
    membership_deletes,
    membership_inserts,
    sort_order_updates,
    retained_already_at_final_order,
    photo_records,
    invariants,
    pass,
    errors,
  };

  // Fail closed: no executable plan payload when pass is false
  if (!pass) {
    return {
      ...report,
      executable: false,
      title_updates: [],
      membership_retains: [],
      membership_deletes: [],
      membership_inserts: [],
      sort_order_updates: [],
      retained_already_at_final_order: 0,
      photo_records: [],
    };
  }

  return report;
}

export function workingDecisionsFromManifest(
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
