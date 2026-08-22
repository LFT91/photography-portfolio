import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const ROOT = process.cwd();

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe("public production routes", () => {
  it("does not register curator routes in the public Next app", () => {
    assert.equal(existsSync(path.join(ROOT, "src/app/admin")), false);
    assert.equal(existsSync(path.join(ROOT, "src/app/api/admin")), false);
    assert.equal(existsSync(path.join(ROOT, "src/app/api")), false);
    assert.equal(
      existsSync(path.join(ROOT, "tools/curator/app/admin/page.tsx")),
      true,
    );
  });

  it("keeps child_process curator code out of the public app tree", () => {
    assert.equal(
      existsSync(path.join(ROOT, "src/app/api/admin/ready/route.ts")),
      false,
    );
    assert.equal(
      existsSync(path.join(ROOT, "src/app/api/admin/upload/route.ts")),
      false,
    );
    assert.equal(
      existsSync(path.join(ROOT, "tools/curator/app/api/admin/ready/route.ts")),
      true,
    );
    const hits = walkFiles(path.join(ROOT, "src/app")).filter((file) =>
      readFileSync(file, "utf8").includes("child_process"),
    );
    assert.deepEqual(hits, []);
  });

  it("omits /admin from a public production build manifest when present", () => {
    if (process.env.ASSERT_PUBLIC_BUILD !== "1") return;
    const manifestPath = path.join(ROOT, ".next/app-path-routes-manifest.json");
    assert.equal(existsSync(manifestPath), true, "public build manifest missing");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<
      string,
      string
    >;
    const routes = [...Object.keys(manifest), ...Object.values(manifest)].join(
      "\n",
    );
    assert.equal(routes.includes("/admin"), false);
    assert.equal(routes.includes("/api/admin"), false);

    const bundleHits: string[] = [];
    for (const file of walkFiles(path.join(ROOT, ".next"))) {
      if (file.includes(`${path.sep}cache${path.sep}`)) continue;
      const text = readFileSync(file, "utf8");
      if (
        text.includes("supabase.co") ||
        text.includes("@supabase") ||
        text.includes("node:child_process")
      ) {
        bundleHits.push(path.relative(ROOT, file));
      }
    }
    assert.deepEqual(bundleHits, []);
  });
});
