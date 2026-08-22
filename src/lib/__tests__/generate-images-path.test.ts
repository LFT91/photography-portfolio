import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import {
  assertResolvedInside,
  assertSafeMasterRel,
  contentVersion,
} from "../../../scripts/generate-images.mjs";

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, "scripts", "generate-images.mjs");

describe("generate-images --file path safety", () => {
  it("rejects absolute paths and parent traversal", () => {
    assert.throws(() => assertSafeMasterRel("/etc/passwd"), /absolute/);
    assert.throws(() => assertSafeMasterRel("\\windows\\path"), /absolute/);
    assert.throws(() => assertSafeMasterRel("C:\\masters\\a.jpg"), /absolute/);
    assert.throws(() => assertSafeMasterRel("../secret.jpg"), /traversal/);
    assert.throws(
      () => assertSafeMasterRel("nature/../../../etc/passwd"),
      /traversal/,
    );
    assert.throws(() => assertSafeMasterRel("nature/foo/../../x.jpg"), /traversal/);
    assert.equal(assertSafeMasterRel("nature/coastal-moon.jpg"), "nature/coastal-moon.jpg");
    assert.equal(assertSafeMasterRel("./urban/foo.jpg"), "urban/foo.jpg");
  });

  it("rejects resolved paths that escape the allowed directory", () => {
    const parent = path.join(ROOT, "public", "images");
    assert.doesNotThrow(() =>
      assertResolvedInside(path.join(parent, "tile", "x.jpg"), parent, "generated image"),
    );
    assert.throws(
      () =>
        assertResolvedInside(path.join(parent, "..", "secret.jpg"), parent, "generated image"),
      /outside/,
    );
  });

  it("CLI --file rejects traversal before generating", () => {
    const masters = mkdtempSync(path.join(tmpdir(), "fatni-masters-"));
    mkdirSync(path.join(masters, "nature"));
    writeFileSync(path.join(masters, "nature", "ok.jpg"), "not-an-image");

    const run = (fileArg: string) =>
      spawnSync(process.execPath, [SCRIPT, "--file", fileArg], {
        cwd: ROOT,
        env: { ...process.env, MASTERS_DIR: masters },
        encoding: "utf8",
      });

    const absolute = run("/etc/passwd");
    assert.notEqual(absolute.status, 0);
    assert.match(`${absolute.stderr}${absolute.stdout}`, /absolute/);

    const traversal = run("../secret.jpg");
    assert.notEqual(traversal.status, 0);
    assert.match(`${traversal.stderr}${traversal.stdout}`, /traversal/);

    const nested = run("nature/../../secret.jpg");
    assert.notEqual(nested.status, 0);
    assert.match(`${nested.stderr}${nested.stdout}`, /traversal/);
  });
});

describe("generated image content versions", () => {
  it("is deterministic for identical bytes and changes when bytes change", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "fatni-hash-"));
    const a = path.join(dir, "a.jpg");
    const b = path.join(dir, "b.jpg");
    writeFileSync(a, "same-bytes");
    writeFileSync(b, "same-bytes");
    assert.equal(contentVersion(a), contentVersion(b));
    assert.equal(
      contentVersion(a),
      createHash("sha256").update("same-bytes").digest("hex").slice(0, 12),
    );
    writeFileSync(b, "other-bytes");
    assert.notEqual(contentVersion(a), contentVersion(b));
  });
});
