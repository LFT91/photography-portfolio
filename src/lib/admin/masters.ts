import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

export type MastersStatus =
  | { ok: true; dir: string }
  | { ok: false; reason: string };

export function getMastersStatus(
  projectRoot = process.cwd(),
): MastersStatus {
  const raw = process.env.MASTERS_DIR?.trim();
  if (!raw) {
    return {
      ok: false,
      reason:
        "MASTERS_DIR is not set. Add Photograph copies originals into that folder and will not store masters in Git. Set MASTERS_DIR in .env.local to an existing directory outside the repo, then restart `npm run curate`.",
    };
  }

  const resolved = resolve(raw);
  const root = resolve(projectRoot);
  const prefix = root.endsWith("/") ? root : `${root}/`;
  if (resolved === root || resolved.startsWith(prefix)) {
    return {
      ok: false,
      reason:
        "MASTERS_DIR must be outside this Git repository. Camera originals are not stored in the project tree.",
    };
  }

  if (!existsSync(resolved)) {
    return {
      ok: false,
      reason: `MASTERS_DIR does not exist: ${raw}`,
    };
  }
  try {
    if (!statSync(resolved).isDirectory()) {
      return {
        ok: false,
        reason: `MASTERS_DIR is not a directory: ${raw}`,
      };
    }
  } catch {
    return {
      ok: false,
      reason: `MASTERS_DIR is not readable: ${raw}`,
    };
  }
  return { ok: true, dir: resolved };
}
