import { existsSync, statSync } from "node:fs";

export type MastersStatus =
  | { ok: true; dir: string }
  | { ok: false; reason: string };

export function getMastersStatus(): MastersStatus {
  const raw = process.env.MASTERS_DIR?.trim();
  if (!raw) {
    return {
      ok: false,
      reason:
        "MASTERS_DIR is not set. Add Photograph copies originals into that folder and will not store masters in Git. Set MASTERS_DIR in .env.local to an existing directory outside the repo.",
    };
  }
  if (!existsSync(raw)) {
    return {
      ok: false,
      reason: `MASTERS_DIR does not exist: ${raw}`,
    };
  }
  try {
    if (!statSync(raw).isDirectory()) {
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
  return { ok: true, dir: raw };
}
