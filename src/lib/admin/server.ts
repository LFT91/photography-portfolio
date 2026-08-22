import { NextResponse } from "next/server";
import { readCatalogFromDisk, writeCatalogFiles } from "@/lib/admin/catalog-writer";
import { unassignedIds } from "@/lib/admin/draft";
import { assertLocalCuratorRequest } from "@/lib/admin/guard";
import {
  DEFAULT_MASTERS_LABEL,
  displayMastersPath,
  getMastersStatus,
} from "@/lib/admin/masters";
import { validateCatalog, type CatalogIssue } from "@/lib/admin/validate";
import type { CatalogDraft } from "@/lib/admin/types";

export function forbiddenOrNull(request: Request) {
  return assertLocalCuratorRequest(request);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function curatorPayload(draft?: CatalogDraft) {
  const current = draft ?? readCatalogFromDisk();
  const masters = getMastersStatus();
  return {
    photos: current.photos,
    collections: current.collections,
    unassignedIds: unassignedIds(current.photos, current.collections),
    mastersArchiveLabel: masters.ok
      ? displayMastersPath(masters.dir)
      : DEFAULT_MASTERS_LABEL,
  };
}

export function saveDraft(draft: CatalogDraft): {
  ok: true;
  payload: ReturnType<typeof curatorPayload>;
} | {
  ok: false;
  issues: CatalogIssue[];
} {
  const issues = validateCatalog(draft);
  if (issues.length) return { ok: false, issues };
  writeCatalogFiles(draft);
  return { ok: true, payload: curatorPayload(readCatalogFromDisk()) };
}
