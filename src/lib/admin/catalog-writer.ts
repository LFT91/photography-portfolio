import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { CatalogDraft, CuratorPhoto } from "@/lib/admin/types";
import {
  collectionsFromCurator,
  collectionsToCurator,
  photosToCurator,
} from "@/lib/admin/shape";

const PHOTOS_PREFIX = `export type PhotoId = string;

export type PhotoRecord = {
  title: string;
  src: string;
  displayScale?: number;
};

/** Canonical photograph records. One metadata object per photograph. */
export const photos = `;

const PHOTOS_SUFFIX = ` as const satisfies Record<PhotoId, PhotoRecord>;

export type CatalogPhotoId = keyof typeof photos;
`;

function indent(level: number): string {
  return "  ".repeat(level);
}

function serializePhotoRecord(photo: CuratorPhoto, level: number): string {
  const pad = indent(level);
  const inner = indent(level + 1);
  const lines = [
    `${pad}${JSON.stringify(photo.id)}: {`,
    `${inner}title: ${JSON.stringify(photo.title)},`,
    `${inner}src: ${JSON.stringify(photo.src)},`,
  ];
  if (photo.displayScale != null && photo.displayScale !== 1) {
    lines.push(`${inner}displayScale: ${photo.displayScale},`);
  }
  lines.push(`${pad}},`);
  return lines.join("\n");
}

export function serializePhotosFile(photos: readonly CuratorPhoto[]): string {
  const body = photos.map((photo) => serializePhotoRecord(photo, 1)).join("\n");
  return `${PHOTOS_PREFIX}{\n${body}\n}${PHOTOS_SUFFIX}`;
}

function serializeIdArray(ids: readonly string[], level: number): string {
  if (ids.length === 0) return "[] as const";
  const inner = ids
    .map((id) => `${indent(level + 1)}${JSON.stringify(id)},`)
    .join("\n");
  return `[\n${inner}\n${indent(level)}] as const`;
}

export function serializeCollectionsBlock(draft: CatalogDraft): string {
  const nested = collectionsFromCurator(draft.collections);
  const fatniKeys = ["nature", "urban", "astro", "street", "monochrome"];
  const ayoubKeys = ["afterDark", "monochrome"];
  const fatni = fatniKeys
    .map(
      (key) =>
        `${indent(2)}${key}: ${serializeIdArray(nested.fatni[key] ?? [], 2)},`,
    )
    .join("\n");
  const ayoub = ayoubKeys
    .map(
      (key) =>
        `${indent(2)}${key}: ${serializeIdArray(nested.ayoub[key] ?? [], 2)},`,
    )
    .join("\n");
  return `/** Ordered photograph IDs for each public collection. */
export const collections = {
  fatni: {
${fatni}
  },
  ayoub: {
${ayoub}
  },
} as const;`;
}

function atomicWrite(filePath: string, contents: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, contents, "utf8");
  renameSync(tmp, filePath);
}

export function catalogPaths(projectRoot = process.cwd()) {
  return {
    photos: join(projectRoot, "src", "content", "photos.ts"),
    collections: join(projectRoot, "src", "content", "collections.ts"),
  };
}

function evalObjectLiteral<T>(source: string): T {
  const stripped = source.replace(/\bas const\b/g, "");
  return new Function(`"use strict"; return (${stripped});`)() as T;
}

function extractAssignedObject(source: string, name: string): string {
  const marker = `export const ${name} = `;
  const start = source.indexOf(marker);
  if (start < 0) {
    throw new Error(`Could not find ${name} export in catalogue file.`);
  }
  const brace = source.indexOf("{", start + marker.length);
  if (brace < 0) {
    throw new Error(`Could not parse ${name} object.`);
  }
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(brace, i + 1);
      }
    }
  }
  throw new Error(`Unclosed ${name} object.`);
}

export function readCatalogFromDisk(
  projectRoot = process.cwd(),
): CatalogDraft {
  const paths = catalogPaths(projectRoot);
  const photosSource = readFileSync(
    /* turbopackIgnore: true */ paths.photos,
    "utf8",
  );
  const collectionsSource = readFileSync(
    /* turbopackIgnore: true */ paths.collections,
    "utf8",
  );
  const photosRecord = evalObjectLiteral<
    Record<string, { title: string; src: string; displayScale?: number }>
  >(extractAssignedObject(photosSource, "photos"));
  const nested = evalObjectLiteral<{
    fatni: Record<string, string[]>;
    ayoub: Record<string, string[]>;
  }>(extractAssignedObject(collectionsSource, "collections"));
  return {
    photos: photosToCurator(photosRecord),
    collections: collectionsToCurator({
      fatni: {
        nature: nested.fatni.nature ?? [],
        urban: nested.fatni.urban ?? [],
        astro: nested.fatni.astro ?? [],
        street: nested.fatni.street ?? [],
        monochrome: nested.fatni.monochrome ?? [],
      },
      ayoub: {
        afterDark: nested.ayoub.afterDark ?? [],
        monochrome: nested.ayoub.monochrome ?? [],
      },
    }),
  };
}

function replaceCollectionsBlock(source: string, block: string): string {
  const startMarker = "/** Ordered photograph IDs for each public collection. */";
  const start = source.indexOf(startMarker);
  if (start < 0) {
    throw new Error("Could not find collections block in collections.ts.");
  }
  const end = source.indexOf("\n} as const;", start);
  if (end < 0) {
    throw new Error("Could not find end of collections block.");
  }
  const after = source.slice(end + "\n} as const;".length);
  return `${source.slice(0, start)}${block}${after}`;
}

export function writeCatalogFiles(
  draft: CatalogDraft,
  projectRoot = process.cwd(),
): void {
  const paths = catalogPaths(projectRoot);
  atomicWrite(paths.photos, serializePhotosFile(draft.photos));
  const current = readFileSync(
    /* turbopackIgnore: true */ paths.collections,
    "utf8",
  );
  atomicWrite(
    paths.collections,
    replaceCollectionsBlock(current, serializeCollectionsBlock(draft)),
  );
}
