import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { collections } from "../../content/collections";
import { photos, type CatalogPhotoId } from "../../content/photos";
import { getCollectionPhotos, getFatniCollectionSummaries, unassignedPhotoIds } from "../catalog";

const ROOT = process.cwd();

const EXPECTED_COUNTS = {
  "fatni.nature": 35,
  "fatni.urban": 38,
  "fatni.astro": 13,
  "fatni.street": 37,
  "fatni.monochrome": 14,
  "ayoub.afterDark": 30,
  "ayoub.monochrome": 21,
} as const;

const FATNI_NATURE_TITLES = [
  "Aerial View",
  "Coastal Cove",
  "Forest Divide",
  "Kayaks in the Rock Pool",
  "Mountain Village",
  "Volcanic Peaks",
  "Rift Above the Sea",
  "Glacier Watch",
  "Alpine Church",
  "Glacial Lagoon",
  "Diamond Beach",
  "Ice Shore",
  "The Lookout",
  "Cave of Two Waters",
  "Valley Light",
  "Message on the Shore",
  "Crater Chain",
  "At the Falls",
  "Kirkjufell Falls",
  "Veiled Valley",
  "Pasture Rainbow",
  "Winter Crossing",
  "White Peacock",
  "Black Shore",
  "Island at Dusk",
  "Afterimage at Sunset",
  "Island Outlook",
  "The Bridge Keeper",
  "Two in the Mist",
  "Boathouse Under Storm",
  "White Silence",
  "Red Tuk-Tuk in Fog",
  "Deer Herd",
  "Refuge Below the Peaks",
  "Stags Clash",
];

const AYOUB_AFTER_DARK_TITLES = [
  "CyberPunk",
  "Blue Oculus",
  "Night Shift",
  "Last Bus",
  "Around the corner",
  "Red light",
  "Fog Street",
  "Blue Poncho",
  "Path Lights",
  "Tower Bridge Fog",
  "Rain Bus",
  "Noodle Alley",
  "End of the Pier",
  "Waiting Under the Lamps",
  "Threshold",
  "Suffocating",
  "Bond",
  "Pizza flip",
  "Fogbound Traffic",
  "Among us",
  "In  the woods",
  "Blue",
  "Still",
  "Puddle jump",
  "Before the Fire",
  "Into the Fog",
  "Soho Kitchen",
  "Rain Mosaic",
  "Blade Runner II",
  "Night Patrol",
];

describe("catalogue integrity", () => {
  it("has one metadata record per photograph and no duplicate IDs", () => {
    const ids = Object.keys(photos);
    assert.equal(ids.length, new Set(ids).size);
    assert.equal(ids.length, 194);
  });

  it("references only known photograph IDs", () => {
    const known = new Set(Object.keys(photos));
    const used: string[] = [];
    for (const id of collections.fatni.nature) used.push(id);
    for (const id of collections.fatni.urban) used.push(id);
    for (const id of collections.fatni.astro) used.push(id);
    for (const id of collections.fatni.street) used.push(id);
    for (const id of collections.fatni.monochrome) used.push(id);
    for (const id of collections.ayoub.afterDark) used.push(id);
    for (const id of collections.ayoub.monochrome) used.push(id);

    assert.equal(used.length, 188);
    assert.equal(new Set(used).size, 188);
    for (const id of used) {
      assert.equal(known.has(id), true, `unknown id ${id}`);
    }
  });

  it("keeps the recovered unassigned library out of public collections", () => {
    assert.deepEqual(unassignedPhotoIds().sort(), [
      "coastal-moon",
      "hillside-lights",
      "star-road",
      "steel-wool-stars",
      "sunburst-walk",
      "sunset-shore",
    ]);
  });

  it("keeps the live production collection sizes", () => {
    assert.equal(collections.fatni.nature.length, EXPECTED_COUNTS["fatni.nature"]);
    assert.equal(collections.fatni.urban.length, EXPECTED_COUNTS["fatni.urban"]);
    assert.equal(collections.fatni.astro.length, EXPECTED_COUNTS["fatni.astro"]);
    assert.equal(collections.fatni.street.length, EXPECTED_COUNTS["fatni.street"]);
    assert.equal(
      collections.fatni.monochrome.length,
      EXPECTED_COUNTS["fatni.monochrome"],
    );
    assert.equal(
      collections.ayoub.afterDark.length,
      EXPECTED_COUNTS["ayoub.afterDark"],
    );
    assert.equal(
      collections.ayoub.monochrome.length,
      EXPECTED_COUNTS["ayoub.monochrome"],
    );
  });

  it("preserves Fatni Nature titles and order", () => {
    assert.deepEqual(
      collections.fatni.nature.map((id) => photos[id as CatalogPhotoId].title),
      FATNI_NATURE_TITLES,
    );
  });

  it("preserves Ayoub After Dark titles and order", () => {
    assert.deepEqual(
      collections.ayoub.afterDark.map((id) => photos[id as CatalogPhotoId].title),
      AYOUB_AFTER_DARK_TITLES,
    );
  });

  it("does not share photographs across brands", () => {
    const fatni = new Set<string>([
      ...collections.fatni.nature,
      ...collections.fatni.urban,
      ...collections.fatni.astro,
      ...collections.fatni.street,
      ...collections.fatni.monochrome,
    ]);
    const ayoub = new Set<string>([
      ...collections.ayoub.afterDark,
      ...collections.ayoub.monochrome,
    ]);
    for (const id of fatni) {
      assert.equal(ayoub.has(id), false, `cross-brand id ${id}`);
    }
  });

  it("keeps Fortnum Night scale and local path", () => {
    assert.equal(photos["fortnum-night"].title, "Fortnum Night");
    assert.equal(photos["fortnum-night"].displayScale, 0.83);
    assert.equal(photos["fortnum-night"].src, "/images/urban/fortnum-night.jpg");
  });
});

describe("site switching", () => {
  it("returns Fatni Nature from the Fatni site", () => {
    const previous = process.env.NEXT_PUBLIC_SITE_ID;
    process.env.NEXT_PUBLIC_SITE_ID = "fatni-photography";
    try {
      const nature = getCollectionPhotos("Nature");
      assert.equal(nature.length, 35);
      assert.equal(nature[0]?.title, "Aerial View");
      assert.equal(nature[3]?.title, "Kayaks in the Rock Pool");
      assert.deepEqual(
        getFatniCollectionSummaries().map((item) => item.slug),
        ["nature", "urban", "astro", "street", "monochrome"],
      );
      assert.equal(getCollectionPhotos("After Dark").length, 0);
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_ID;
      else process.env.NEXT_PUBLIC_SITE_ID = previous;
    }
  });

  it("returns Ayoub collections from the Ayoub site", () => {
    const previous = process.env.NEXT_PUBLIC_SITE_ID;
    process.env.NEXT_PUBLIC_SITE_ID = "ayoub-el-fatni";
    try {
      const afterDark = getCollectionPhotos("After Dark");
      const mono = getCollectionPhotos("Monochrome");
      assert.equal(afterDark.length, 30);
      assert.equal(afterDark[0]?.title, "CyberPunk");
      assert.equal(mono.length, 21);
      assert.equal(mono[0]?.title, "Disc Facade");
      assert.equal(getCollectionPhotos("Nature").length, 0);
      assert.deepEqual(getFatniCollectionSummaries(), []);
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_ID;
      else process.env.NEXT_PUBLIC_SITE_ID = previous;
    }
  });
});

describe("static assets", () => {
  it("points every photograph at a local file that exists", () => {
    for (const photo of Object.values(photos)) {
      assert.match(photo.src, /^\/images\//);
      assert.equal(
        existsSync(path.join(ROOT, "public", photo.src)),
        true,
        photo.src,
      );
    }
  });

  it("contains no Supabase storage URLs", () => {
    const blob = JSON.stringify(photos);
    assert.equal(blob.includes("supabase.co/storage"), false);
    assert.equal(blob.includes("/storage/v1/object"), false);
    assert.equal(blob.includes("/storage/v1/render"), false);
  });
});
