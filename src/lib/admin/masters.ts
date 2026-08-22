import { existsSync, mkdirSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, sep } from "node:path";

export const DEFAULT_MASTERS_LABEL = "~/Pictures/Fatni Photography Masters";

export type MastersStatus =
  | { ok: true; dir: string; fromEnv: boolean }
  | { ok: false; reason: string };

type MastersOptions = {
  env?: { MASTERS_DIR?: string };
  projectRoot?: string;
  home?: string;
};

export function defaultMastersDir(home = homedir()) {
  return join(home, "Pictures", "Fatni Photography Masters");
}

export function displayMastersPath(dir: string, home = homedir()) {
  const resolvedHome = resolve(home);
  const resolvedDir = resolve(dir);
  if (
    resolvedDir === resolvedHome ||
    resolvedDir.startsWith(`${resolvedHome}${sep}`)
  ) {
    return `~${resolvedDir.slice(resolvedHome.length)}`;
  }
  return resolvedDir;
}

export function resolveMastersDir({
  env = process.env as { MASTERS_DIR?: string },
  home = homedir(),
}: Pick<MastersOptions, "env" | "home"> = {}): {
  dir: string;
  fromEnv: boolean;
} {
  const raw = env.MASTERS_DIR?.trim();
  if (raw) return { dir: resolve(raw), fromEnv: true };
  return { dir: resolve(defaultMastersDir(home)), fromEnv: false };
}

export function isInsideRepo(dir: string, projectRoot = process.cwd()) {
  const resolved = resolve(dir);
  const root = resolve(projectRoot);
  const prefix = root.endsWith(sep) ? root : `${root}${sep}`;
  return resolved === root || resolved.startsWith(prefix);
}

export function getMastersStatus({
  env = process.env as { MASTERS_DIR?: string },
  projectRoot = process.cwd(),
  home = homedir(),
}: MastersOptions = {}): MastersStatus {
  const { dir, fromEnv } = resolveMastersDir({ env, home });
  if (isInsideRepo(dir, projectRoot)) {
    return {
      ok: false,
      reason:
        "The master archive must stay outside this Git repository. Camera originals are not stored in the project tree.",
    };
  }
  if (fromEnv && existsSync(dir)) {
    try {
      if (!statSync(dir).isDirectory()) {
        return {
          ok: false,
          reason: "The configured master archive path is not a folder.",
        };
      }
    } catch {
      return {
        ok: false,
        reason: "The configured master archive is not readable.",
      };
    }
  }
  return { ok: true, dir, fromEnv };
}

/** Creates the default or configured archive folder if needed. Never inside Git. */
export function ensureMastersDir(options: MastersOptions = {}): MastersStatus {
  const status = getMastersStatus(options);
  if (!status.ok) return status;
  try {
    mkdirSync(status.dir, { recursive: true });
    if (!statSync(status.dir).isDirectory()) {
      return {
        ok: false,
        reason: "The master archive path is not a folder.",
      };
    }
    const real = realpathSync(status.dir);
    if (isInsideRepo(real, options.projectRoot ?? process.cwd())) {
      return {
        ok: false,
        reason:
          "The master archive must stay outside this Git repository. Camera originals are not stored in the project tree.",
      };
    }
    return { ...status, dir: real };
  } catch {
    return {
      ok: false,
      reason: "Could not create the master archive folder.",
    };
  }
}
