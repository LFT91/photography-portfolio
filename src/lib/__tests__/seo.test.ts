import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FATNI_HOME_DESCRIPTION,
  FATNI_HOME_TITLE,
  fatniHomeJsonLd,
  fatniPersonJsonLd,
  publicSitemapPaths,
  sitemapEntries,
} from "../seo";
import { FATNI_PUBLIC_URL, getPublicSiteUrl } from "../site";

describe("Fatni canonical origin", () => {
  it("uses the www custom domain, not the Vercel hostname", () => {
    const previousSite = process.env.NEXT_PUBLIC_SITE_ID;
    const previousUrl = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_ID;
    process.env.NEXT_PUBLIC_SITE_URL = "https://fatni-photography.vercel.app";

    try {
      assert.equal(FATNI_PUBLIC_URL, "https://www.fatniphotography.com");
      assert.equal(getPublicSiteUrl(), "https://www.fatniphotography.com");
      assert.equal(getPublicSiteUrl().includes("vercel.app"), false);
      assert.equal(getPublicSiteUrl().includes("localhost"), false);
    } finally {
      if (previousSite === undefined) delete process.env.NEXT_PUBLIC_SITE_ID;
      else process.env.NEXT_PUBLIC_SITE_ID = previousSite;
      if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = previousUrl;
    }
  });
});

describe("public sitemap", () => {
  it("lists Fatni public routes and omits admin or utility paths", () => {
    const paths = publicSitemapPaths();
    assert.deepEqual(paths, [
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
    assert.equal(
      paths.some((path) => path.includes("admin")),
      false,
    );
  });

  it("lists Ayoub public routes on the Ayoub site", () => {
    const previous = process.env.NEXT_PUBLIC_SITE_ID;
    process.env.NEXT_PUBLIC_SITE_ID = "ayoub-el-fatni";
    try {
      assert.deepEqual(publicSitemapPaths(), [
        "/",
        "/monochrome",
        "/projects",
        "/projects/after-dark",
        "/about",
        "/contact",
      ]);
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_ID;
      else process.env.NEXT_PUBLIC_SITE_ID = previous;
    }
  });

  it("emits custom-domain URLs only", () => {
    const urls = sitemapEntries().map((entry) => entry.url);
    assert.equal(urls.length, 9);
    for (const url of urls) {
      assert.equal(url.startsWith("https://www.fatniphotography.com"), true);
      assert.equal(url.includes("vercel.app"), false);
      assert.equal(url.includes("localhost"), false);
    }
  });
});

describe("structured data", () => {
  it("connects Fatni Photography to Ayoub El Fatni", () => {
    const graph = fatniHomeJsonLd();
    const json = JSON.stringify(graph);
    JSON.parse(json);

    const website = graph["@graph"][0];
    const person = graph["@graph"][1];

    assert.equal(website["@type"], "WebSite");
    assert.equal(website.name, "Fatni Photography");
    assert.equal(website.url, "https://www.fatniphotography.com/");
    assert.equal(person["@type"], "Person");
    assert.equal(person.name, "Ayoub El Fatni");
    assert.equal(person.jobTitle, "Photographer");
    assert.equal(person.url, "https://www.fatniphotography.com/about");
    assert.equal(person.brand.name, "Fatni Photography");
    assert.equal("sameAs" in person, false);
  });

  it("reuses the same Person @id on the About graph", () => {
    const person = fatniPersonJsonLd();
    assert.equal(person["@id"], "https://www.fatniphotography.com/#person");
    assert.equal(person.name, "Ayoub El Fatni");
  });
});

describe("homepage copy", () => {
  it("keeps the requested title and description", () => {
    assert.equal(
      FATNI_HOME_TITLE,
      "Ayoub El Fatni Photography | Fatni Photography",
    );
    assert.equal(
      FATNI_HOME_DESCRIPTION,
      "Photography by Ayoub El Fatni, featuring street, urban, nature, astrophotography and monochrome work.",
    );
  });
});
