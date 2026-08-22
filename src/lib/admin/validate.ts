import { isSiteId } from "@/content/sites";
import type { CatalogCollection } from "@/content/collections";
import {
  PHOTO_CATEGORIES,
  type CatalogPhoto,
  type PhotoCategory,
} from "@/content/photos";
import {
  IMAGE_DERIVATIVE_WIDTHS,
  publicFileExists,
  type ImageManifest,
} from "@/lib/image-manifest";

export type CatalogDraft = {
  photos: CatalogPhoto[];
  collections: CatalogCollection[];
};

export type CatalogIssue = {
  code: string;
  message: string;
};

const CATEGORY_SET = new Set<string>(PHOTO_CATEGORIES);

export function isPhotoCategory(value: string): value is PhotoCategory {
  return CATEGORY_SET.has(value);
}

export function validateCatalog(
  draft: CatalogDraft,
  options: {
    manifest: ImageManifest;
    projectRoot?: string;
    /** Skip filesystem checks (unit tests). */
    skipFiles?: boolean;
  },
): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  const root = options.projectRoot ?? process.cwd();
  const photosById = new Map<string, CatalogPhoto>();

  for (const photo of draft.photos) {
    if (!photo.id?.trim()) {
      issues.push({ code: "photo-id", message: "Photograph is missing an id." });
      continue;
    }
    if (photosById.has(photo.id)) {
      issues.push({
        code: "duplicate-photo-id",
        message: `Duplicate photograph id “${photo.id}”.`,
      });
      continue;
    }
    if (!photo.title?.trim()) {
      issues.push({
        code: "photo-title",
        message: `Photograph “${photo.id}” is missing a title.`,
      });
    }
    if (!photo.src?.startsWith("/images/")) {
      issues.push({
        code: "photo-src",
        message: `Photograph “${photo.id}” src must be a /images/… path.`,
      });
    }
    photosById.set(photo.id, photo);
  }

  const collectionIds = new Set<string>();
  for (const collection of draft.collections) {
    if (!collection.id?.trim()) {
      issues.push({
        code: "collection-id",
        message: "Collection is missing an id.",
      });
      continue;
    }
    if (collectionIds.has(collection.id)) {
      issues.push({
        code: "duplicate-collection-id",
        message: `Duplicate collection id “${collection.id}”.`,
      });
    }
    collectionIds.add(collection.id);

    if (!isSiteId(collection.siteId)) {
      issues.push({
        code: "site-id",
        message: `Collection “${collection.id}” has invalid siteId “${collection.siteId}”.`,
      });
    }
    if (!isPhotoCategory(collection.title)) {
      issues.push({
        code: "collection-title",
        message: `Collection “${collection.id}” has invalid title “${collection.title}”.`,
      });
    }
    if (!collection.slug?.trim()) {
      issues.push({
        code: "collection-slug",
        message: `Collection “${collection.id}” is missing a slug.`,
      });
    }

    const seen = new Set<string>();
    for (const photoId of collection.photoIds) {
      if (!photosById.has(photoId)) {
        issues.push({
          code: "missing-photo",
          message: `Collection “${collection.id}” references unknown photo “${photoId}”.`,
        });
      }
      if (seen.has(photoId)) {
        issues.push({
          code: "duplicate-membership",
          message: `Collection “${collection.id}” lists “${photoId}” more than once.`,
        });
      }
      seen.add(photoId);
    }
  }

  if (!options.skipFiles) {
    for (const photo of photosById.values()) {
      const entry = options.manifest.photos[photo.id];
      const required = new Set<string>();
      required.add(photo.src);
      if (entry?.src) required.add(entry.src);
      if (entry?.derivatives) {
        for (const width of IMAGE_DERIVATIVE_WIDTHS) {
          const path = entry.derivatives[String(width) as `${(typeof IMAGE_DERIVATIVE_WIDTHS)[number]}`];
          if (path) required.add(path);
        }
      }
      for (const src of required) {
        if (!publicFileExists(src, root)) {
          issues.push({
            code: "missing-file",
            message: `Missing image file for “${photo.id}”: ${src}`,
          });
        }
      }
    }
  }

  return issues;
}
