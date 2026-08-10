import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { describe, it, before } from "node:test";
import { resolve } from "node:path";

if (!globalThis.crypto) {
  // @ts-expect-error node test polyfill
  globalThis.crypto = webcrypto;
}

import {
  buildExportManifest,
  createWorkingDecisions,
  fingerprintDecisions,
  parseAndValidateManifest,
  recomputeRequiredChanges,
  storageKeyForManifest,
  type ImportedDecision,
  type ImportedProposalManifest,
} from "../curation-proposals";
import {
  planCurationDryRun,
  type DryRunLiveSnapshot,
} from "../curation-dry-run";

const MANIFEST_PATH = resolve(
  process.cwd(),
  "tmp/curation-proposals-final-sequenced.json",
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
    assert.equal(
      result.decisions.filter((d) => d.proposal.publication === "publish")
        .length,
      179,
    );
    assert.equal(
      result.decisions.filter((d) => d.proposal.publication === "hold").length,
      50,
    );
  });

  it("rejects duplicate UUID", () => {
    const dup = structuredClone(raw);
    dup.decisions[1].photo_id = dup.decisions[0].photo_id;
    const result = parseAndValidateManifest(dup, liveIds);
    assert.equal(result.ok, false);
  });

  it("rejects unknown UUID", () => {
    const bad = structuredClone(raw);
    bad.decisions[0].photo_id = "00000000-0000-4000-8000-000000000099";
    const result = parseAndValidateManifest(bad, liveIds);
    assert.equal(result.ok, false);
  });

  it("rejects summary mismatch", () => {
    const bad = structuredClone(raw);
    bad.summary = { ...bad.summary!, publish: 1 };
    const result = parseAndValidateManifest(bad, liveIds);
    assert.equal(result.ok, false);
  });

  it("rejects invalid destination", () => {
    const bad = structuredClone(raw);
    const pub = bad.decisions.find((d) => d.proposal.publication === "publish")!;
    pub.proposal.collection_slug = "selected-work";
    const result = parseAndValidateManifest(bad, liveIds);
    assert.equal(result.ok, false);
  });

  it("rejects Hold plus destination", () => {
    const bad = structuredClone(raw);
    const hold = bad.decisions.find((d) => d.proposal.publication === "hold")!;
    hold.proposal.site_id = "fatni-photography";
    hold.proposal.collection_slug = "nature";
    const result = parseAndValidateManifest(bad, liveIds);
    assert.equal(result.ok, false);
  });

  it("rejects duplicate sort order", () => {
    const bad = structuredClone(raw);
    const afterDark = bad.decisions.filter(
      (d) =>
        d.proposal.site_id === "ayoub-el-fatni" &&
        d.proposal.collection_slug === "after-dark",
    );
    afterDark[1].proposal.sort_order = afterDark[0].proposal.sort_order;
    const result = parseAndValidateManifest(bad, liveIds);
    assert.equal(result.ok, false);
  });

  it("rejects order gap", () => {
    const bad = structuredClone(raw);
    const afterDark = bad.decisions.filter(
      (d) =>
        d.proposal.site_id === "ayoub-el-fatni" &&
        d.proposal.collection_slug === "after-dark",
    );
    afterDark[2].proposal.sort_order = 99;
    const result = parseAndValidateManifest(bad, liveIds);
    assert.equal(result.ok, false);
  });

  it("rejects mixed null/non-null sequencing", () => {
    const bad = structuredClone(raw);
    const pub = bad.decisions.find((d) => d.proposal.publication === "publish")!;
    pub.proposal.sort_order = null;
    const result = parseAndValidateManifest(bad, liveIds);
    assert.equal(result.ok, false);
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

describe("fingerprint / localStorage identity", () => {
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
    working[0].reviewer_note = "note";
    const exported = buildExportManifest(parsed.manifest, working);
    const again = parseAndValidateManifest(exported, liveIds);
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(again.decisions.length, 229);
    assert.equal(
      again.decisions.filter((d) => d.proposal.approval === "approved").length,
      229,
    );
    assert.equal(
      again.decisions.find((d) => d.photo_id === working[0].photo_id)?.proposal
        .title,
      working[0].proposal.title,
    );
    assert.ok(exported.sequencing);
    assert.ok(exported.governing_rules);
    assert.equal(
      again.decisions.find((d) => d.photo_id === working[0].photo_id)
        ?.related_photo_id ?? null,
      working[0].original.related_photo_id,
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
    assert.deepEqual(changes.sort(), [
      "replace_with_single_collection_membership",
      "set_display_title",
    ].sort());
  });
});

describe("dry-run planner", () => {
  it("fail-closed when live photo count drifts", () => {
    const raw = JSON.parse(
      readFileSync(MANIFEST_PATH, "utf8"),
    ) as ImportedProposalManifest;
    const parsed = parseAndValidateManifest(
      raw,
      liveIdsFrom(raw.decisions),
    );
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
      manifestSha256: "abc",
    });
    assert.equal(report.pass, false);
    assert.equal(report.executable, false);
    assert.equal(report.membership_inserts.length, 0);
  });
});
