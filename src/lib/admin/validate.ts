import { existsSync } from "node:fs";
import { join } from "node:path";
import type { CatalogDraft, CuratorCollection } from "@/lib/admin/types";
import { CURATOR_COLLECTION_META } from "@/lib/admin/shape";
import { repoRoot } from "@/lib/admin/repo";

export type CatalogIssue = {
  code: string;
  message: string;
};

export function validateCatalog(
  draft: CatalogDraft,
  options?: { projectRoot?: string; skipFiles?: boolean },
): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  const root = options?.projectRoot ?? repoRoot();
  const known = new Set(draft.photos.map((photo) => photo.id));
  const seenPhoto = new Set<string>();

  for (const photo of draft.photos) {
    if (!photo.id.trim()) {
      issues.push({ code: "empty-id", message: "Photograph is missing an id." });
    }
    if (seenPhoto.has(photo.id)) {
      issues.push({
        code: "duplicate-id",
        message: `Duplicate photograph id “${photo.id}”.`,
      });
    }
    seenPhoto.add(photo.id);
    if (!photo.title.trim()) {
      issues.push({
        code: "empty-title",
        message: `Photograph “${photo.id}” needs a title.`,
      });
    }
    if (!photo.src.startsWith("/images/")) {
      issues.push({
        code: "bad-src",
        message: `Photograph “${photo.id}” src must start with /images/.`,
      });
    } else if (!options?.skipFiles) {
      const file = join(root, "public", photo.src);
      if (!existsSync(file)) {
        issues.push({
          code: "missing-file",
          message: `Missing image file for “${photo.id}”: ${photo.src}`,
        });
      }
    }
  }

  const expectedIds = new Set(CURATOR_COLLECTION_META.map((item) => item.id));
  const seenCollections = new Set<string>();
  for (const collection of draft.collections) {
    if (!expectedIds.has(collection.id)) {
      issues.push({
        code: "unknown-collection",
        message: `Unknown collection “${collection.id}”.`,
      });
    }
    if (seenCollections.has(collection.id)) {
      issues.push({
        code: "duplicate-collection",
        message: `Duplicate collection “${collection.id}”.`,
      });
    }
    seenCollections.add(collection.id);
    issues.push(...validateMembership(collection, known));
  }

  for (const expected of expectedIds) {
    if (!seenCollections.has(expected)) {
      issues.push({
        code: "missing-collection",
        message: `Catalogue is missing collection “${expected}”.`,
      });
    }
  }

  return issues;
}

function validateMembership(
  collection: CuratorCollection,
  known: Set<string>,
): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  const seen = new Set<string>();
  for (const id of collection.photoIds) {
    if (!known.has(id)) {
      issues.push({
        code: "missing-photo",
        message: `Collection “${collection.id}” references unknown photograph “${id}”.`,
      });
    }
    if (seen.has(id)) {
      issues.push({
        code: "duplicate-membership",
        message: `Photograph “${id}” appears twice in “${collection.id}”.`,
      });
    }
    seen.add(id);
  }
  return issues;
}
