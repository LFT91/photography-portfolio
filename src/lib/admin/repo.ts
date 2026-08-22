import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Repository root, independent of process.cwd() (curator may run from tools/curator). */
export function repoRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    if (
      existsSync(join(dir, "src", "content", "photos.json")) &&
      existsSync(join(dir, "package.json"))
    ) {
      return dir;
    }
    dir = join(dir, "..");
  }
  throw new Error("Could not locate the Fatni Photography repository root.");
}

export function catalogPaths(projectRoot = repoRoot()) {
  return {
    photos: join(projectRoot, "src", "content", "photos.json"),
    collections: join(projectRoot, "src", "content", "collections.json"),
  };
}

export function publicDir(projectRoot = repoRoot()) {
  return join(projectRoot, "public");
}
