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

const ROOT = process.cwd();

describe("localImagePath", () => {
  it("keeps site-relative image paths", () => {
    assert.equal(
      localImagePath("/images/after-dark/startrails.jpg"),
      "/images/after-dark/startrails.jpg",
    );
  });

  it("strips a content version query from local paths", () => {
    assert.equal(
      localImagePath("/images/after-dark/startrails.jpg?v=abc123"),
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
    assert.match(
      variants.tile.src,
      /^\/images\/tile\/after-dark\/startrails\.jpg\?v=[0-9a-f]{12}$/,
    );
    assert.match(
      variants.display.src,
      /^\/images\/after-dark\/startrails\.jpg\?v=[0-9a-f]{12}$/,
    );
    assert.ok((variants.tile.width ?? 0) <= TILE_WIDTH);
    assert.ok((variants.display.width ?? 0) <= DISPLAY_WIDTH);
  });

  it("never puts the 1800px display file in the gallery srcset", () => {
    const srcset = gridSrcSet("/images/after-dark/startrails.jpg");
    assert.ok(srcset);
    assert.equal(srcset.includes("/images/after-dark/startrails.jpg?"), false);
    assert.equal(srcset.includes("1800w"), false);
    assert.match(srcset, /\/images\/tile\/after-dark\/startrails\.jpg\?v=[0-9a-f]{12}/);
  });

  it("keeps a stable content version until the generated file bytes change", () => {
    const first = variantsFor("/images/after-dark/startrails.jpg");
    const second = variantsFor("/images/after-dark/startrails.jpg");
    assert.equal(first.tile.version, second.tile.version);
    assert.ok(first.tile.version);
    assert.notEqual(first.tile.version, first.display.version);
  });
});

describe("heroImage", () => {
  it("uses the dedicated hero derivative", () => {
    const hero = heroImage();
    assert.match(hero.src, /^\/images\/hero\/startrails\.jpg\?v=[0-9a-f]{12}$/);
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
