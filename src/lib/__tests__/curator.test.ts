import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it } from "node:test";
import { readCatalogFromDisk } from "../admin/catalog-writer";
import {
  addToCollection,
  moveToCollection,
  removeFromCollection,
  reorderInCollection,
  unassignedIds,
  updatePhoto,
} from "../admin/draft";
import { isLocalCuratorEnabled, isLoopbackHost } from "../admin/guard";
import {
  DEFAULT_MASTERS_LABEL,
  displayMastersPath,
  ensureMastersDir,
  getMastersStatus,
  resolveMastersDir,
} from "../admin/masters";
import { allocatePhotoId } from "../admin/photo-id";
import { collectionsToCurator, photosToCurator } from "../admin/shape";
import { validateCatalog } from "../admin/validate";
import { photos } from "../../content/photos";

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

describe("local curator guard", () => {
  it("accepts loopback hosts only", () => {
    assert.equal(isLoopbackHost("127.0.0.1:3000"), true);
    assert.equal(isLoopbackHost("localhost"), true);
    assert.equal(isLoopbackHost("example.com"), false);
  });

  it("requires CURATOR=1 in development and never on Vercel", () => {
    const previous = {
      NODE_ENV: process.env.NODE_ENV,
      CURATOR: process.env.CURATOR,
      VERCEL: process.env.VERCEL,
    };
    const env = process.env as { NODE_ENV?: string; CURATOR?: string; VERCEL?: string };
    try {
      env.NODE_ENV = "development";
      env.CURATOR = "1";
      delete env.VERCEL;
      assert.equal(isLocalCuratorEnabled(), true);

      env.CURATOR = "0";
      assert.equal(isLocalCuratorEnabled(), false);

      env.CURATOR = "1";
      env.VERCEL = "1";
      assert.equal(isLocalCuratorEnabled(), false);

      delete env.VERCEL;
      env.NODE_ENV = "production";
      assert.equal(isLocalCuratorEnabled(), false);
    } finally {
      env.NODE_ENV = previous.NODE_ENV;
      if (previous.CURATOR === undefined) delete env.CURATOR;
      else env.CURATOR = previous.CURATOR;
      if (previous.VERCEL === undefined) delete env.VERCEL;
      else env.VERCEL = previous.VERCEL;
    }
  });
});

describe("draft membership", () => {
  it("reorders inside a collection", () => {
    const { collections: cols } = sampleDraft();
    const next = reorderInCollection(cols, "fatni.nature", 0, 0);
    const moved = addToCollection(cols, "fatni.nature", "b", 0);
    assert.deepEqual(
      moved.find((item) => item.id === "fatni.nature")?.photoIds,
      ["b", "a"],
    );
    assert.equal(next.find((item) => item.id === "fatni.nature")?.photoIds[0], "a");
  });

  it("moves between collections without duplicating in the source", () => {
    const { collections: cols } = sampleDraft();
    const next = moveToCollection(cols, "a", "fatni.nature", "ayoub.afterDark");
    assert.deepEqual(
      next.find((item) => item.id === "fatni.nature")?.photoIds,
      [],
    );
    assert.deepEqual(
      next.find((item) => item.id === "ayoub.afterDark")?.photoIds,
      ["a"],
    );
  });

  it("can add the same photograph to a second collection", () => {
    const { collections: cols } = sampleDraft();
    const next = addToCollection(cols, "fatni.urban", "a");
    assert.deepEqual(
      next.find((item) => item.id === "fatni.nature")?.photoIds,
      ["a"],
    );
    assert.deepEqual(
      next.find((item) => item.id === "fatni.urban")?.photoIds,
      ["a"],
    );
  });

  it("remove from collection keeps the canonical photograph", () => {
    const draft = sampleDraft();
    const collections = removeFromCollection(
      draft.collections,
      "fatni.nature",
      "a",
    );
    assert.deepEqual(unassignedIds(draft.photos, collections), ["a", "b"]);
  });

  it("updates title and displayScale on the canonical record", () => {
    const draft = sampleDraft();
    const photos = updatePhoto(draft.photos, "a", {
      title: "Renamed",
      displayScale: 0.8,
    });
    assert.equal(photos[0]?.title, "Renamed");
    assert.equal(photos[0]?.displayScale, 0.8);
  });
});

describe("photo ids", () => {
  it("allocates a stable slug and avoids collisions", () => {
    assert.equal(allocatePhotoId("Coastal Moon", new Set()), "coastal-moon");
    assert.equal(
      allocatePhotoId("Coastal Moon", new Set(["coastal-moon"])),
      "coastal-moon-2",
    );
  });
});

describe("catalogue validation", () => {
  it("rejects unknown photo ids and duplicate memberships", () => {
    const draft = sampleDraft();
    const nature = draft.collections.find((item) => item.id === "fatni.nature");
    nature?.photoIds.push("a", "missing");
    const issues = validateCatalog(draft, { skipFiles: true });
    assert.equal(
      issues.some((issue) => issue.code === "duplicate-membership"),
      true,
    );
    assert.equal(issues.some((issue) => issue.code === "missing-photo"), true);
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
    assert.deepEqual(
      draft.collections.map((item) => item.photoIds),
      fromModules.collections.map((item) => item.photoIds),
    );
  });
});

describe("master archive", () => {
  it("defaults to Pictures/Fatni Photography Masters when MASTERS_DIR is unset", () => {
    const { dir, fromEnv } = resolveMastersDir({
      env: {},
      home: "/Users/photographer",
    });
    assert.equal(fromEnv, false);
    assert.equal(
      dir,
      resolve("/Users/photographer/Pictures/Fatni Photography Masters"),
    );
    assert.equal(
      displayMastersPath(dir, "/Users/photographer"),
      DEFAULT_MASTERS_LABEL,
    );
  });

  it("uses MASTERS_DIR as an override", () => {
    const { dir, fromEnv } = resolveMastersDir({
      env: { MASTERS_DIR: "/Volumes/Archive/masters" },
      home: "/Users/photographer",
    });
    assert.equal(fromEnv, true);
    assert.equal(dir, resolve("/Volumes/Archive/masters"));
  });

  it("refuses a master archive inside the repository", () => {
    const status = getMastersStatus({
      env: { MASTERS_DIR: process.cwd() },
      projectRoot: process.cwd(),
    });
    assert.equal(status.ok, false);
  });

  it("creates a missing archive outside the repository", () => {
    const home = mkdtempSync(join(tmpdir(), "fatni-home-"));
    const status = ensureMastersDir({
      env: {},
      home,
      projectRoot: process.cwd(),
    });
    assert.equal(status.ok, true);
    if (!status.ok) return;
    assert.equal(existsSync(status.dir), true);
    assert.match(status.dir, /Fatni Photography Masters$/);
  });
});
