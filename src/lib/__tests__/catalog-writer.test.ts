import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  readCatalogFromDisk,
  writeCatalogFiles,
} from "../admin/catalog-writer";
import { collectionsToCurator } from "../admin/shape";
import { validateCatalog } from "../admin/validate";
import { photos } from "../../content/photos";
import { photosToCurator } from "../admin/shape";

function sampleDraft() {
  return {
    photos: [
      { id: "a", title: "A", src: "/images/a.jpg" },
      { id: "b", title: "B", src: "/images/b.jpg" },
    ],
    collections: collectionsToCurator({
      fatni: {
        nature: ["a"],
        urban: [],
        astro: [],
        street: [],
        monochrome: [],
      },
      ayoub: {
        afterDark: [],
        monochrome: [],
      },
    }),
  };
}

function seedCatalog(root: string) {
  mkdirSync(join(root, "src", "content"), { recursive: true });
  writeCatalogFiles(sampleDraft(), root, { skipFiles: true });
}

describe("JSON catalogue writer", () => {
  it("does not parse TypeScript with eval or new Function", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/admin/catalog-writer.ts"),
      "utf8",
    );
    assert.equal(source.includes("new Function"), false);
    assert.equal(/\beval\s*\(/.test(source), false);
  });

  it("rejects malformed JSON instead of repairing it", () => {
    const root = mkdtempSync(join(tmpdir(), "fatni-cat-"));
    mkdirSync(join(root, "src", "content"), { recursive: true });
    writeFileSync(join(root, "src/content/photos.json"), "{not json", "utf8");
    writeFileSync(
      join(root, "src/content/collections.json"),
      JSON.stringify({
        fatni: { nature: [], urban: [], astro: [], street: [], monochrome: [] },
        ayoub: { afterDark: [], monochrome: [] },
      }),
      "utf8",
    );
    assert.throws(() => readCatalogFromDisk(root), /valid JSON/);
    rmSync(root, { recursive: true, force: true });
  });

  it("requires every public collection", () => {
    const draft = sampleDraft();
    draft.collections = draft.collections.filter((item) => item.id !== "fatni.street");
    const issues = validateCatalog(draft, { skipFiles: true });
    assert.equal(
      issues.some((issue) => issue.code === "missing-collection"),
      true,
    );
  });

  it("writes both JSON files together and can round-trip", () => {
    const root = mkdtempSync(join(tmpdir(), "fatni-cat-"));
    seedCatalog(root);
    const read = readCatalogFromDisk(root);
    assert.deepEqual(
      read.photos.map((photo) => photo.id),
      ["a", "b"],
    );
    assert.deepEqual(
      read.collections.find((item) => item.id === "fatni.nature")?.photoIds,
      ["a"],
    );
    rmSync(root, { recursive: true, force: true });
  });

  it("rolls back photos.json if collections.json cannot be replaced", () => {
    const root = mkdtempSync(join(tmpdir(), "fatni-cat-"));
    seedCatalog(root);
    const photosPath = join(root, "src/content/photos.json");
    const collectionsPath = join(root, "src/content/collections.json");
    const originalPhotos = readFileSync(photosPath, "utf8");
    rmSync(collectionsPath);
    mkdirSync(collectionsPath);

    const next = sampleDraft();
    next.photos[0] = { ...next.photos[0]!, title: "Renamed" };
    assert.throws(() => writeCatalogFiles(next, root, { skipFiles: true }));
    assert.equal(readFileSync(photosPath, "utf8"), originalPhotos);
    rmSync(root, { recursive: true, force: true });
  });

  it("refuses a draft with unknown photograph ids", () => {
    const draft = sampleDraft();
    const nature = draft.collections.find((item) => item.id === "fatni.nature");
    nature?.photoIds.push("ghost");
    const issues = validateCatalog(draft, { skipFiles: true });
    assert.equal(issues.some((issue) => issue.code === "missing-photo"), true);
    assert.throws(() =>
      writeCatalogFiles(draft, mkdtempSync(join(tmpdir(), "fatni-cat-")), {
        skipFiles: true,
      }),
    );
  });

  it("rejects collections.json that omits a required collection", () => {
    const root = mkdtempSync(join(tmpdir(), "fatni-cat-"));
    mkdirSync(join(root, "src", "content"), { recursive: true });
    writeFileSync(
      join(root, "src/content/photos.json"),
      JSON.stringify({ a: { title: "A", src: "/images/a.jpg" } }),
      "utf8",
    );
    writeFileSync(
      join(root, "src/content/collections.json"),
      JSON.stringify({
        fatni: { nature: [], urban: [], astro: [], monochrome: [] },
        ayoub: { afterDark: [], monochrome: [] },
      }),
      "utf8",
    );
    assert.throws(() => readCatalogFromDisk(root), /missing fatni.street/);
    rmSync(root, { recursive: true, force: true });
  });

  it("refuses duplicate membership inside a collection", () => {
    const draft = sampleDraft();
    const nature = draft.collections.find((item) => item.id === "fatni.nature");
    nature?.photoIds.push("a");
    const issues = validateCatalog(draft, { skipFiles: true });
    assert.equal(
      issues.some((issue) => issue.code === "duplicate-membership"),
      true,
    );
    assert.throws(() =>
      writeCatalogFiles(draft, mkdtempSync(join(tmpdir(), "fatni-cat-")), {
        skipFiles: true,
      }),
    );
  });
});

describe("on-disk catalogue", () => {
  it("reads the current nested catalogue without changing public memberships", () => {
    const draft = readCatalogFromDisk();
    const fromModules = {
      photos: photosToCurator(photos),
      collections: collectionsToCurator(),
    };
    assert.equal(draft.photos.length, fromModules.photos.length);
    assert.equal(draft.photos.length, 194);
    assert.deepEqual(
      draft.collections.map((item) => item.photoIds),
      fromModules.collections.map((item) => item.photoIds),
    );
  });
});
