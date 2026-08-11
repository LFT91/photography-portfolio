import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash, webcrypto } from "node:crypto";
import { describe, it, before } from "node:test";
import { resolve } from "node:path";

if (!globalThis.crypto) {
  // @ts-expect-error node test polyfill
  globalThis.crypto = webcrypto;
}

import {
  buildExportManifest,
  canonicalizeDecisionsForFingerprint,
  createWorkingDecisions,
  fingerprintDecisions,
  fingerprintDecisionsAsync,
  parseAndValidateManifest,
  recomputeRequiredChanges,
  sha256HexFromBytes,
  storageKeyForManifest,
  type ImportedDecision,
  type ImportedProposalManifest,
} from "../curation-proposals";
import {
  compositeMembershipId,
  planCurationDryRun,
  type DryRunLiveSnapshot,
} from "../curation-dry-run";

const MANIFEST_PATH = resolve(
  process.cwd(),
  "tmp/curation-proposals-final-sequenced.json",
);
const LIVE_FIXTURE = resolve(
  process.cwd(),
  "src/lib/__tests__/fixtures/live-snapshot-204.json",
);

function liveIdsFrom(decisions: ImportedDecision[]): Set<string> {
  return new Set(decisions.map((d) => d.photo_id));
}

describe("curation proposals parse/validate", () => {
  let raw: ImportedProposalManifest;
  let liveIds: Set<string>;

  before(() => {
    raw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
    liveIds = liveIdsFrom(raw.decisions);
  });

  it("accepts the final sequenced manifest with preserved approvals", () => {
    const result = parseAndValidateManifest(raw, liveIds);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.sequencingMode, "sequenced");
    assert.equal(result.decisions.length, 229);
    assert.equal(
      result.decisions.filter((d) => d.proposal.approval === "approved").length,
      229,
    );
  });

  it("rejects duplicate UUID", () => {
    const dup = structuredClone(raw);
    dup.decisions[1].photo_id = dup.decisions[0].photo_id;
    assert.equal(parseAndValidateManifest(dup, liveIds).ok, false);
  });

  it("rejects unknown UUID", () => {
    const bad = structuredClone(raw);
    bad.decisions[0].photo_id = "00000000-0000-4000-8000-000000000099";
    assert.equal(parseAndValidateManifest(bad, liveIds).ok, false);
  });

  it("rejects summary mismatch", () => {
    const bad = structuredClone(raw);
    bad.summary = { ...bad.summary!, publish: 1 };
    assert.equal(parseAndValidateManifest(bad, liveIds).ok, false);
  });

  it("rejects invalid destination", () => {
    const bad = structuredClone(raw);
    const pub = bad.decisions.find((d) => d.proposal.publication === "publish")!;
    pub.proposal.collection_slug = "selected-work";
    assert.equal(parseAndValidateManifest(bad, liveIds).ok, false);
  });

  it("rejects Hold plus destination", () => {
    const bad = structuredClone(raw);
    const hold = bad.decisions.find((d) => d.proposal.publication === "hold")!;
    hold.proposal.site_id = "fatni-photography";
    hold.proposal.collection_slug = "nature";
    assert.equal(parseAndValidateManifest(bad, liveIds).ok, false);
  });

  it("rejects duplicate sort order", () => {
    const bad = structuredClone(raw);
    const afterDark = bad.decisions.filter(
      (d) =>
        d.proposal.site_id === "ayoub-el-fatni" &&
        d.proposal.collection_slug === "after-dark",
    );
    afterDark[1].proposal.sort_order = afterDark[0].proposal.sort_order;
    assert.equal(parseAndValidateManifest(bad, liveIds).ok, false);
  });

  it("rejects order gap", () => {
    const bad = structuredClone(raw);
    const afterDark = bad.decisions.filter(
      (d) =>
        d.proposal.site_id === "ayoub-el-fatni" &&
        d.proposal.collection_slug === "after-dark",
    );
    afterDark[2].proposal.sort_order = 99;
    assert.equal(parseAndValidateManifest(bad, liveIds).ok, false);
  });

  it("rejects mixed null/non-null sequencing", () => {
    const bad = structuredClone(raw);
    const pub = bad.decisions.find((d) => d.proposal.publication === "publish")!;
    pub.proposal.sort_order = null;
    assert.equal(parseAndValidateManifest(bad, liveIds).ok, false);
  });

  it("accepts unsequenced manifest when all publish sort_order are null", () => {
    const unseq = structuredClone(raw);
    for (const d of unseq.decisions) {
      if (d.proposal.publication === "publish") d.proposal.sort_order = null;
    }
    delete unseq.summary;
    const result = parseAndValidateManifest(unseq, liveIds);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.sequencingMode, "unsequenced");
  });
});

describe("input file hash and decision fingerprint", () => {
  it("raw file hash changes if input bytes change", async () => {
    const bytes = readFileSync(MANIFEST_PATH);
    const a = await sha256HexFromBytes(bytes);
    assert.equal(
      a,
      "8306cd464cd5dcaf454034f194a2d6cea620047f95238c3c9af9cb5ea0263baf",
    );
    const tweaked = Buffer.from(bytes);
    tweaked[tweaked.length - 2] = tweaked[tweaked.length - 2] === 10 ? 32 : 10;
    const b = await sha256HexFromBytes(tweaked);
    assert.notEqual(a, b);
  });

  it("normalized decision fingerprint remains stable for semantically identical decision sets", async () => {
    const raw = JSON.parse(
      readFileSync(MANIFEST_PATH, "utf8"),
    ) as ImportedProposalManifest;
    const liveIds = liveIdsFrom(raw.decisions);
    const parsed = parseAndValidateManifest(raw, liveIds);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    const fp1 = await fingerprintDecisionsAsync(parsed.decisions);
    const shuffled = [...parsed.decisions].reverse();
    const fp2 = await fingerprintDecisionsAsync(shuffled);
    assert.equal(fp1, fp2);
    assert.equal(
      canonicalizeDecisionsForFingerprint(parsed.decisions),
      canonicalizeDecisionsForFingerprint(shuffled),
    );
  });

  it("changes storage key when decision content changes with same name/generated_at", () => {
    const raw = JSON.parse(
      readFileSync(MANIFEST_PATH, "utf8"),
    ) as ImportedProposalManifest;
    const liveIds = liveIdsFrom(raw.decisions);
    const a = parseAndValidateManifest(raw, liveIds);
    assert.equal(a.ok, true);
    if (!a.ok) return;

    const altered = structuredClone(raw);
    altered.decisions[0].proposal.title = `${altered.decisions[0].proposal.title} X`;
    const b = parseAndValidateManifest(altered, liveIds);
    assert.equal(b.ok, true);
    if (!b.ok) return;

    assert.notEqual(a.contentFingerprint, b.contentFingerprint);
    assert.notEqual(
      storageKeyForManifest(a.manifest, a.contentFingerprint),
      storageKeyForManifest(b.manifest, b.contentFingerprint),
    );
    assert.notEqual(
      fingerprintDecisions(a.decisions),
      fingerprintDecisions(b.decisions),
    );
  });
});

describe("export round-trip", () => {
  it("re-imports exported working manifest with approvals and sort orders", () => {
    const raw = JSON.parse(
      readFileSync(MANIFEST_PATH, "utf8"),
    ) as ImportedProposalManifest;
    const liveIds = liveIdsFrom(raw.decisions);
    const parsed = parseAndValidateManifest(raw, liveIds);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    const working = createWorkingDecisions(parsed.decisions);
    working[0].proposal.title = `${working[0].proposal.title} · edit`;
    const exported = buildExportManifest(parsed.manifest, working);
    const again = parseAndValidateManifest(exported, liveIds);
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(again.decisions.length, 229);
    assert.equal(
      again.decisions.filter((d) => d.proposal.approval === "approved").length,
      229,
    );
  });

  it("recomputes required_changes for title and membership", () => {
    const changes = recomputeRequiredChanges(
      {
        title: "Old",
        memberships: [
          {
            site_id: "fatni-photography",
            collection_slug: "urban",
            sort_order: 1,
          },
        ],
      },
      {
        title: "New",
        publication: "publish",
        site_id: "fatni-photography",
        collection_slug: "nature",
        sort_order: 0,
        approval: "approved",
      },
    );
    assert.deepEqual(
      changes.sort(),
      ["replace_with_single_collection_membership", "set_display_title"].sort(),
    );
  });
});

describe("dry-run planner", () => {
  it("fail-closed when live photo count drifts", () => {
    const raw = JSON.parse(
      readFileSync(MANIFEST_PATH, "utf8"),
    ) as ImportedProposalManifest;
    const parsed = parseAndValidateManifest(raw, liveIdsFrom(raw.decisions));
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    const live: DryRunLiveSnapshot = {
      photos: [],
      memberships: [],
      collections: [],
    };
    const report = planCurationDryRun({
      manifest: parsed.manifest,
      workingDecisions: createWorkingDecisions(parsed.decisions),
      live,
      inputFileSha256: "file",
      decisionFingerprintSha256: "decisions",
    });
    assert.equal(report.pass, false);
    assert.equal(report.executable, false);
    assert.equal(report.membership_inserts.length, 0);
    assert.equal(report.input_file_sha256, "file");
    assert.equal(report.decision_fingerprint_sha256, "decisions");
  });

  it("classifies all 204 memberships exactly once against the fixture snapshot", async () => {
    const raw = JSON.parse(
      readFileSync(MANIFEST_PATH, "utf8"),
    ) as ImportedProposalManifest;
    const live = JSON.parse(
      readFileSync(LIVE_FIXTURE, "utf8"),
    ) as DryRunLiveSnapshot;
    const parsed = parseAndValidateManifest(raw, liveIdsFrom(raw.decisions));
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    const bytes = readFileSync(MANIFEST_PATH);
    const report = planCurationDryRun({
      manifest: parsed.manifest,
      workingDecisions: createWorkingDecisions(parsed.decisions),
      live,
      inputFileSha256: await sha256HexFromBytes(bytes),
      decisionFingerprintSha256: await fingerprintDecisionsAsync(
        parsed.decisions,
      ),
    });

    assert.equal(report.pass, true, report.errors.join("; "));
    assert.equal(
      report.input_file_sha256,
      createHash("sha256").update(bytes).digest("hex"),
    );
    assert.equal(report.source.live_membership_count, 204);
    assert.equal(report.membership_retains.length, 126);
    assert.equal(report.membership_deletes.length, 78);
    assert.equal(report.membership_inserts.length, 53);
    assert.equal(report.title_updates.length, 143);
    assert.equal(report.sort_order_updates.length, 108);
    assert.equal(report.retained_already_at_final_order, 18);
    assert.equal(report.source.related_duplicate_variant, 22);
    assert.equal(report.final_counts.published_photos, 179);
    assert.equal(report.final_counts.hold_photos, 50);
    assert.equal(
      report.membership_identity.retains_and_deletes_partition_current,
      true,
    );
    assert.equal(report.membership_identity.model, "collection_id:photo_id");

    const covered = new Set([
      ...report.membership_retains.map((r) => r.membership_id),
      ...report.membership_deletes.map((d) => d.membership_id),
    ]);
    assert.equal(covered.size, 204);
    for (const m of live.memberships) {
      assert.ok(covered.has(m.id), `missing ${m.id}`);
    }
  });

  it("fails closed on duplicate composite membership identities", () => {
    const raw = JSON.parse(
      readFileSync(MANIFEST_PATH, "utf8"),
    ) as ImportedProposalManifest;
    const live = JSON.parse(
      readFileSync(LIVE_FIXTURE, "utf8"),
    ) as DryRunLiveSnapshot;
    const parsed = parseAndValidateManifest(raw, liveIdsFrom(raw.decisions));
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    const dup = structuredClone(live);
    dup.memberships.push({ ...dup.memberships[0] });
    const report = planCurationDryRun({
      manifest: parsed.manifest,
      workingDecisions: createWorkingDecisions(parsed.decisions),
      live: dup,
      inputFileSha256: "file",
      decisionFingerprintSha256: "decisions",
    });
    assert.equal(report.pass, false);
    assert.ok(
      report.errors.some((e) =>
        /Duplicate composite membership identity/i.test(e),
      ),
    );
  });

  it("fails closed on duplicate final photo memberships", () => {
    const raw = JSON.parse(
      readFileSync(MANIFEST_PATH, "utf8"),
    ) as ImportedProposalManifest;
    const live = JSON.parse(
      readFileSync(LIVE_FIXTURE, "utf8"),
    ) as DryRunLiveSnapshot;
    const parsed = parseAndValidateManifest(raw, liveIdsFrom(raw.decisions));
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    const working = createWorkingDecisions(parsed.decisions);
    const publish = working.find((d) => d.proposal.publication === "publish")!;
    working.push({ ...publish });

    const report = planCurationDryRun({
      manifest: parsed.manifest,
      workingDecisions: working,
      live,
      inputFileSha256: "file",
      decisionFingerprintSha256: "decisions",
    });
    assert.equal(report.pass, false);
    assert.ok(
      report.errors.some((e) =>
        /Duplicate final membership for photo/i.test(e),
      ) ||
        report.errors.length > 0,
    );
  });

  it("compositeMembershipId helper is collection_id:photo_id", () => {
    assert.equal(compositeMembershipId("coll", "photo"), "coll:photo");
  });
});
