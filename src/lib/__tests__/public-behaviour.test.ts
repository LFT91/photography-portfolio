import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { CONTENT_SECURITY_POLICY, SECURITY_HEADERS } from "../security-headers";

const ROOT = process.cwd();

function source(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

describe("production security headers", () => {
  it("sets nosniff, referrer, permissions, frame, and CSP baselines", () => {
    const keys = SECURITY_HEADERS.map((header) => header.key);
    assert.deepEqual(keys, [
      "X-Content-Type-Options",
      "Referrer-Policy",
      "X-Frame-Options",
      "Permissions-Policy",
      "Content-Security-Policy",
    ]);
    assert.equal(
      SECURITY_HEADERS.find((header) => header.key === "X-Content-Type-Options")
        ?.value,
      "nosniff",
    );
    assert.match(CONTENT_SECURITY_POLICY, /object-src 'none'/);
    assert.match(CONTENT_SECURITY_POLICY, /base-uri 'self'/);
    assert.match(CONTENT_SECURITY_POLICY, /frame-ancestors 'none'/);
    assert.match(CONTENT_SECURITY_POLICY, /default-src 'self'/);
    assert.equal(CONTENT_SECURITY_POLICY.includes("google-analytics"), false);
    assert.equal(CONTENT_SECURITY_POLICY.includes("https:"), false);
  });

  it("is applied by the public Next config", () => {
    const config = source("next.config.ts");
    assert.match(config, /SECURITY_HEADERS/);
    assert.match(config, /source: "\/:path\*"/);
  });
});

describe("public accessibility contracts", () => {
  it("keeps a skip link to #main", () => {
    const layout = source("src/app/layout.tsx");
    assert.match(layout, /href="#main"/);
    assert.match(layout, /Skip to content/);
    assert.match(source("src/app/page.tsx"), /id="main"/);
  });

  it("opens the gallery from a keyboard-focusable control", () => {
    const tile = source("src/components/PhotoTile.tsx");
    assert.match(tile, /<button/);
    assert.match(tile, /onClick=\{\(\) => onOpen\(index\)\}/);
  });

  it("prioritises the first two gallery images and lazy-loads the rest", () => {
    assert.match(source("src/components/PhotoGrid.tsx"), /priority=\{index < 2\}/);
    const image = source("src/components/PhotoImage.tsx");
    assert.match(image, /loading=\{priority \? "eager" : "lazy"\}/);
    assert.match(image, /fetchPriority=\{priority \? "high" : undefined\}/);
  });

  it("traps focus in the lightbox and restores it on close", () => {
    const lightbox = source("src/components/Lightbox.tsx");
    assert.match(lightbox, /e\.key === "Escape"/);
    assert.match(lightbox, /ArrowLeft/);
    assert.match(lightbox, /ArrowRight/);
    assert.match(lightbox, /previousFocus\.current\?\.focus\(\)/);
    assert.match(lightbox, /role="dialog"/);
    assert.match(lightbox, /aria-modal="true"/);
  });

  it("exposes mobile menu semantics", () => {
    const header = source("src/components/Header.tsx");
    assert.match(header, /aria-expanded=\{open\}/);
    assert.match(header, /aria-controls=\{menuId\}/);
    assert.match(header, /aria-label=\{open \? "Close menu" : "Open menu"\}/);
  });

  it("uses photograph titles as alt text", () => {
    assert.match(source("src/components/PhotoTile.tsx"), /alt=\{photo\.title\}/);
  });
});
