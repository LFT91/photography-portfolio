import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextResponse } from "next/server";
import { sites } from "@/content/sites";
import { readCatalogFromDisk, writeCatalogFiles } from "@/lib/admin/catalog-writer";
import { unassignedIds } from "@/lib/admin/draft";
import { assertLocalCuratorRequest } from "@/lib/admin/guard";
import { getMastersStatus } from "@/lib/admin/masters";
import { validateCatalog, type CatalogDraft } from "@/lib/admin/validate";
import type { ImageManifest } from "@/lib/image-manifest";

export function readManifest(projectRoot = process.cwd()): ImageManifest {
  const raw = JSON.parse(
    readFileSync(
      /* turbopackIgnore: true */ resolve(projectRoot, "src", "data", "image-manifest.json"),
      "utf8",
    ),
  ) as ImageManifest;
  return {
    version: 1,
    widths: [480, 800, 1200, 1800],
    photos: raw.photos ?? {},
  };
}

export function curatorPayload(draft?: CatalogDraft) {
  const current = draft ?? readCatalogFromDisk();
  const masters = getMastersStatus();
  return {
    photos: current.photos,
    collections: current.collections,
    sites,
    unassignedIds: unassignedIds(current.photos, current.collections),
    canUpload: masters.ok,
    uploadDisabledReason: masters.ok ? null : masters.reason,
  };
}

export function saveDraft(draft: CatalogDraft) {
  const issues = validateCatalog(draft, { manifest: readManifest() });
  if (issues.length) {
    return { ok: false as const, issues };
  }
  writeCatalogFiles(draft);
  return { ok: true as const, payload: curatorPayload(draft) };
}

export function forbiddenOrNull(request: Request) {
  return assertLocalCuratorRequest(request);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
