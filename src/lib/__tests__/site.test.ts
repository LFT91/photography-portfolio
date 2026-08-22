import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FATNI_COLLECTION_DEFS } from "../../content/collections";
import { SITES, SITE_IDS } from "../../content/sites";
import { publicSitemapPaths } from "../seo";
import {
  DEFAULT_SITE_ID,
  FATNI_PUBLIC_URL,
  getActiveSiteId,
} from "../site";

describe("site identity", () => {
  it("defaults to Fatni when SITE_ID is unset", () => {
    const previous = process.env.NEXT_PUBLIC_SITE_ID;
    delete process.env.NEXT_PUBLIC_SITE_ID;
    try {
      assert.equal(getActiveSiteId(), SITE_IDS.FATNI);
      assert.equal(DEFAULT_SITE_ID, SITE_IDS.FATNI);
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_ID;
      else process.env.NEXT_PUBLIC_SITE_ID = previous;
    }
  });

  it("keeps the two brands distinct", () => {
    assert.equal(SITES["fatni-photography"].name, "Fatni Photography");
    assert.equal(SITES["ayoub-el-fatni"].name, "Ayoub El Fatni");
    assert.equal(
      SITES["fatni-photography"].nav.some((link) => link.label === "Focused Work"),
      true,
    );
    assert.equal(
      SITES["ayoub-el-fatni"].nav.some((link) => link.label === "Broader Work"),
      true,
    );
  });
});

describe("Fatni collections", () => {
  it("exposes the five public archive rooms", () => {
    assert.deepEqual(
      FATNI_COLLECTION_DEFS.map((collection) => collection.slug),
      ["nature", "urban", "astro", "street", "monochrome"],
    );
    assert.equal(
      FATNI_COLLECTION_DEFS.some((collection) => collection.slug === "after-dark"),
      false,
    );
  });
});

describe("canonical URLs", () => {
  it("keeps Fatni on the custom domain", () => {
    assert.equal(FATNI_PUBLIC_URL, "https://www.fatniphotography.com");
    assert.deepEqual(publicSitemapPaths(), [
      "/",
      "/work",
      "/work/nature",
      "/work/urban",
      "/work/astro",
      "/work/street",
      "/work/monochrome",
      "/about",
      "/contact",
    ]);
  });
});
