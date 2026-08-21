import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DISPLAY_WIDTH,
  TILE_WIDTH,
  heroImage,
  localImagePath,
  supabaseRenderUrl,
  variantsFor,
} from "../image";

describe("localImagePath", () => {
  it("keeps site-relative image paths", () => {
    assert.equal(
      localImagePath("/images/after-dark/startrails.jpg"),
      "/images/after-dark/startrails.jpg",
    );
  });

  it("extracts /images paths from the Fatni and Vercel hosts", () => {
    assert.equal(
      localImagePath(
        "https://fatni-photography.vercel.app/images/nature/sea-stacks.jpg",
      ),
      "/images/nature/sea-stacks.jpg",
    );
    assert.equal(
      localImagePath(
        "https://www.fatniphotography.com/images/nature/sea-stacks.jpg",
      ),
      "/images/nature/sea-stacks.jpg",
    );
  });

  it("ignores supabase object URLs", () => {
    assert.equal(
      localImagePath(
        "https://example.supabase.co/storage/v1/object/public/photos/abc.jpg",
      ),
      null,
    );
  });
});

describe("variantsFor", () => {
  it("maps a local master path to tile and display derivatives", () => {
    const variants = variantsFor("/images/after-dark/startrails.jpg");
    assert.equal(variants.tile.src, "/images/tile/after-dark/startrails.jpg");
    assert.equal(variants.display.src, "/images/after-dark/startrails.jpg");
    assert.ok((variants.tile.width ?? 0) <= 800);
    assert.ok((variants.display.width ?? 0) <= 1800);
  });

  it("rewrites supabase object URLs to the render API", () => {
    const src =
      "https://eisupstzytkhpxbhjjdz.supabase.co/storage/v1/object/public/photos/abc.jpg";
    const variants = variantsFor(src);
    assert.equal(
      variants.tile.src,
      supabaseRenderUrl(src, TILE_WIDTH),
    );
    assert.equal(
      variants.display.src,
      supabaseRenderUrl(src, DISPLAY_WIDTH),
    );
    assert.match(variants.tile.src, /\/render\/image\/public\/photos\/abc.jpg/);
    assert.match(variants.tile.src, /width=800/);
  });
});

describe("heroImage", () => {
  it("uses the dedicated hero derivative, not the master", () => {
    const hero = heroImage();
    assert.equal(hero.src, "/images/hero/startrails.jpg");
    assert.ok((hero.width ?? 0) <= 1600);
  });
});
