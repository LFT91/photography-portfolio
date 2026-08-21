import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fatniArchiveCollections, fatniDefBySlug } from "../fatni-collections";
import { isRetiredCollection } from "../retired-collections";
import {
  DEFAULT_SITE_ID,
  FATNI_PUBLIC_URL,
  SITE_IDS,
  getActiveSiteId,
} from "../site";
import { publicSitemapPaths } from "../seo";

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
});

describe("Fatni collections", () => {
  it("exposes the five public archive rooms", () => {
    assert.deepEqual(
      fatniArchiveCollections().map((c) => c.slug),
      ["nature", "urban", "astro", "street", "monochrome"],
    );
    assert.equal(fatniDefBySlug("after-dark"), undefined);
  });
});

describe("retired collections", () => {
  it("flags the retired Fatni After Dark and Ayoub Selected Work rooms", () => {
    assert.equal(isRetiredCollection("fatni-photography", "after-dark"), true);
    assert.equal(isRetiredCollection("ayoub-el-fatni", "selected-work"), true);
    assert.equal(isRetiredCollection("fatni-photography", "nature"), false);
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
