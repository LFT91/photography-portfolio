import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { CatalogCollection } from "@/content/collections";
import type { CatalogPhoto } from "@/content/photos";
import type { CatalogDraft } from "@/lib/admin/validate";
import type { ImageManifest } from "@/lib/image-manifest";

const PHOTOS_HEADER = `export const PHOTO_CATEGORIES = [
  "Nature",
  "Urban",
  "Astro",
  "Street",
  "Monochrome",
  "After Dark",
  "Selected Work",
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export type CatalogPhoto = {
  id: string;
  title: string;
  /** Public web path under /images. */
  src: string;
  displayScale?: number;
};

export const photos: CatalogPhoto[] = `;

const COLLECTIONS_HEADER = `import type { SiteId } from "./sites";
import type { PhotoCategory } from "./photos";

export type CatalogCollection = {
  id: string;
  siteId: SiteId;
  title: PhotoCategory;
  slug: string;
  sortOrder: number;
  photoIds: string[];
};

export const collections: CatalogCollection[] = `;

function indent(level: number): string {
  return "  ".repeat(level);
}

function serializePhoto(photo: CatalogPhoto, level: number): string {
  const pad = indent(level);
  const inner = indent(level + 1);
  const lines = [
    `${pad}{`,
    `${inner}id: ${JSON.stringify(photo.id)},`,
    `${inner}title: ${JSON.stringify(photo.title)},`,
    `${inner}src: ${JSON.stringify(photo.src)},`,
  ];
  if (photo.displayScale != null && photo.displayScale !== 1) {
    lines.push(`${inner}displayScale: ${photo.displayScale},`);
  }
  lines.push(`${pad}}`);
  return lines.join("\n");
}

function serializeCollection(
  collection: CatalogCollection,
  level: number,
): string {
  const pad = indent(level);
  const inner = indent(level + 1);
  const ids =
    collection.photoIds.length === 0
      ? "[]"
      : `[\n${collection.photoIds
          .map((id) => `${indent(level + 2)}${JSON.stringify(id)},`)
          .join("\n")}\n${inner}]`;
  return [
    `${pad}{`,
    `${inner}id: ${JSON.stringify(collection.id)},`,
    `${inner}siteId: ${JSON.stringify(collection.siteId)},`,
    `${inner}title: ${JSON.stringify(collection.title)},`,
    `${inner}slug: ${JSON.stringify(collection.slug)},`,
    `${inner}sortOrder: ${collection.sortOrder},`,
    `${inner}photoIds: ${ids},`,
    `${pad}}`,
  ].join("\n");
}

export function serializePhotosFile(photos: readonly CatalogPhoto[]): string {
  const body = photos
    .map((photo) => serializePhoto(photo, 1))
    .join(",\n");
  return `${PHOTOS_HEADER}[\n${body}${photos.length ? "," : ""}\n];\n`;
}

export function serializeCollectionsFile(
  collections: readonly CatalogCollection[],
): string {
  const body = collections
    .map((collection) => serializeCollection(collection, 1))
    .join(",\n");
  return `${COLLECTIONS_HEADER}[\n${body}${collections.length ? "," : ""}\n];\n`;
}

export function serializeManifest(manifest: ImageManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function atomicWrite(filePath: string, contents: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  writeFileSync(/* turbopackIgnore: true */ tmp, contents, "utf8");
  renameSync(/* turbopackIgnore: true */ tmp, filePath);
}

export function catalogPaths(projectRoot = process.cwd()) {
  return {
    photos: join(projectRoot, "src", "content", "photos.ts"),
    collections: join(projectRoot, "src", "content", "collections.ts"),
    manifest: join(projectRoot, "src", "data", "image-manifest.json"),
  };
}

export function readCatalogFromDisk(
  projectRoot = process.cwd(),
): CatalogDraft {
  const paths = catalogPaths(projectRoot);
  return {
    photos: evalExportedArray(
      readFileSync(/* turbopackIgnore: true */ paths.photos, "utf8"),
      "photos",
    ),
    collections: evalExportedArray(
      readFileSync(/* turbopackIgnore: true */ paths.collections, "utf8"),
      "collections",
    ),
  };
}

function evalExportedArray<T>(source: string, name: string): T[] {
  const marker = `export const ${name}`;
  const start = source.indexOf(marker);
  if (start < 0) {
    throw new Error(`Could not find ${name} export in catalogue file.`);
  }
  const eq = source.indexOf("=", start);
  const arrStart = source.indexOf("[", eq);
  if (arrStart < 0) {
    throw new Error(`Could not parse ${name} array.`);
  }
  const arr = source.slice(arrStart).trim().replace(/;\s*$/, "");
  return new Function(`"use strict"; return (${arr});`)() as T[];
}

export function writeCatalogFiles(
  draft: CatalogDraft,
  options?: { projectRoot?: string; manifest?: ImageManifest },
): void {
  const paths = catalogPaths(options?.projectRoot);
  atomicWrite(paths.photos, serializePhotosFile(draft.photos));
  atomicWrite(paths.collections, serializeCollectionsFile(draft.collections));
  if (options?.manifest) {
    atomicWrite(paths.manifest, serializeManifest(options.manifest));
  }
}
