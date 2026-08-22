import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import manifest from "../../data/image-manifest.json";
import { photos } from "../../content/photos";
import {
  DISPLAY_WIDTH,
  TILE_WIDTH,
  gridSrcSet,
  heroImage,
  localImagePath,
  variantsFor,
} from "../image";

const ROOT = path.resolve(import.meta.dirname, "../../..");

describe("localImagePath", () => {
  it("keeps site-relative image paths", () => {
    assert.equal(
      localImagePath("/images/after-dark/startrails.jpg"),
      "/images/after-dark/startrails.jpg",
    );
  });

  it("rejects remote URLs", () => {
    assert.equal(localImagePath("https://example.com/images/x.jpg"), null);
  });
});

describe("variantsFor", () => {
  it("maps a local path to tile and display derivatives", () => {
    const variants = variantsFor("/images/after-dark/startrails.jpg");
    assert.equal(variants.tile.src, "/images/tile/after-dark/startrails.jpg");
    assert.equal(variants.display.src, "/images/after-dark/startrails.jpg");
    assert.ok((variants.tile.width ?? 0) <= TILE_WIDTH);
    assert.ok((variants.display.width ?? 0) <= DISPLAY_WIDTH);
  });

  it("never puts the 1800px display file in the gallery srcset", () => {
    const srcset = gridSrcSet("/images/after-dark/startrails.jpg");
    assert.ok(srcset);
    assert.equal(srcset.includes("/images/after-dark/startrails.jpg"), false);
    assert.equal(srcset.includes("1800w"), false);
    assert.match(srcset, /\/images\/tile\/after-dark\/startrails\.jpg/);
  });
});

describe("heroImage", () => {
  it("uses the dedicated hero derivative", () => {
    const hero = heroImage();
    assert.equal(hero.src, "/images/hero/startrails.jpg");
    assert.ok((hero.width ?? 0) <= 1600);
  });
});

describe("manifest consistency", () => {
  it("has a manifest entry and tile file for every catalogue photograph", () => {
    for (const photo of Object.values(photos)) {
      const entry = (manifest as Record<string, { tile: { src: string } }>)[
        photo.src
      ];
      assert.ok(entry, `missing manifest ${photo.src}`);
      assert.equal(
        existsSync(path.join(ROOT, "public", entry.tile.src)),
        true,
        entry.tile.src,
      );
    }
  });
});
