import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collections } from "../../content/collections";
import { photos } from "../../content/photos";
import { SITE_IDS } from "../../content/sites";
import {
  addToCollection,
  moveIndex,
  moveToCollection,
  removeFromCollection,
  unassignedIds,
  updatePhoto,
} from "../admin/draft";
import { allocatePhotoId } from "../admin/photo-id";
import { validateCatalog } from "../admin/validate";
import { isLoopbackHost } from "../admin/guard";

describe("static catalogue", () => {
  it("keeps the live membership counts", () => {
    assert.equal(photos.length, 201);
    const byId = Object.fromEntries(
      collections.map((collection) => [collection.id, collection.photoIds.length]),
    );
    assert.equal(byId["fatni-nature"], 35);
    assert.equal(byId["fatni-urban"], 38);
    assert.equal(byId["fatni-astro"], 13);
    assert.equal(byId["fatni-street"], 37);
    assert.equal(byId["fatni-monochrome"], 14);
    assert.equal(byId["ayoub-after-dark"], 30);
    assert.equal(byId["ayoub-monochrome"], 21);
    assert.equal(unassignedIds(photos, collections).length, 13);
  });

  it("validates the on-disk catalogue", () => {
    const issues = validateCatalog(
      { photos, collections },
      {
        manifest: { version: 1, widths: [480, 800, 1200, 1800], photos: {} },
        skipFiles: true,
      },
    );
    assert.deepEqual(issues, []);
  });
});

describe("catalogue validation", () => {
  it("rejects unknown photo ids and duplicate memberships", () => {
    const issues = validateCatalog(
      {
        photos: [{ id: "a", title: "A", src: "/images/a.jpg" }],
        collections: [
          {
            id: "fatni-nature",
            siteId: SITE_IDS.FATNI,
            title: "Nature",
            slug: "nature",
            sortOrder: 0,
            photoIds: ["a", "a", "missing"],
          },
        ],
      },
      {
        manifest: { version: 1, widths: [480, 800, 1200, 1800], photos: {} },
        skipFiles: true,
      },
    );
    assert.equal(
      issues.some((issue) => issue.code === "duplicate-membership"),
      true,
    );
    assert.equal(issues.some((issue) => issue.code === "missing-photo"), true);
  });
});

describe("draft membership", () => {
  const base = [
    {
      id: "fatni-nature",
      siteId: SITE_IDS.FATNI,
      title: "Nature" as const,
      slug: "nature",
      sortOrder: 0,
      photoIds: ["a", "b"],
    },
    {
      id: "ayoub-after-dark",
      siteId: SITE_IDS.AYOUB,
      title: "After Dark" as const,
      slug: "after-dark",
      sortOrder: 0,
      photoIds: ["c"],
    },
  ];

  it("reorders inside a collection", () => {
    assert.deepEqual(moveIndex(["a", "b", "c"], 2, 0), ["c", "a", "b"]);
  });

  it("moves between sites without duplicating in the source", () => {
    const next = moveToCollection(base, "a", "fatni-nature", "ayoub-after-dark", 0);
    assert.deepEqual(
      next.find((item) => item.id === "fatni-nature")?.photoIds,
      ["b"],
    );
    assert.deepEqual(
      next.find((item) => item.id === "ayoub-after-dark")?.photoIds,
      ["a", "c"],
    );
  });

  it("can add the same photograph to a second collection", () => {
    const next = addToCollection(base, "ayoub-after-dark", "a");
    assert.deepEqual(
      next.find((item) => item.id === "fatni-nature")?.photoIds,
      ["a", "b"],
    );
    assert.deepEqual(
      next.find((item) => item.id === "ayoub-after-dark")?.photoIds,
      ["c", "a"],
    );
  });

  it("remove from collection keeps the canonical photograph", () => {
    const photos = [
      { id: "a", title: "A", src: "/images/a.jpg" },
      { id: "b", title: "B", src: "/images/b.jpg" },
    ];
    const next = removeFromCollection(base, "fatni-nature", "a");
    assert.deepEqual(
      next.find((item) => item.id === "fatni-nature")?.photoIds,
      ["b"],
    );
    assert.equal(photos.some((photo) => photo.id === "a"), true);
    assert.deepEqual(unassignedIds(photos, next), ["a"]);
  });

  it("updates title and displayScale on the canonical record", () => {
    const next = updatePhoto(
      [{ id: "a", title: "Old", src: "/images/a.jpg" }],
      "a",
      { title: "New", displayScale: 0.8 },
    );
    assert.equal(next[0]?.title, "New");
    assert.equal(next[0]?.displayScale, 0.8);
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

describe("local curator guard", () => {
  it("accepts loopback hosts only", () => {
    assert.equal(isLoopbackHost("localhost:3000"), true);
    assert.equal(isLoopbackHost("127.0.0.1"), true);
    assert.equal(isLoopbackHost("www.fatniphotography.com"), false);
  });
});
