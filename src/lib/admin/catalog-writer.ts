import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import type { CatalogDraft } from "@/lib/admin/types";
import {
  collectionsFromCurator,
  collectionsToCurator,
  photosFromCurator,
  photosToCurator,
} from "@/lib/admin/shape";
import { catalogPaths, repoRoot } from "@/lib/admin/repo";
import { validateCatalog } from "@/lib/admin/validate";

export type PhotosFile = Record<
  string,
  { title: string; src: string; displayScale?: number }
>;

export type CollectionsFile = {
  fatni: Record<string, string[]>;
  ayoub: Record<string, string[]>;
};

const REQUIRED_FATNI = [
  "nature",
  "urban",
  "astro",
  "street",
  "monochrome",
] as const;
const REQUIRED_AYOUB = ["afterDark", "monochrome"] as const;

function requiredIds(
  groups: Record<string, string[]>,
  key: string,
  label: string,
): string[] {
  if (!Object.hasOwn(groups, key)) {
    throw new Error(`Corrupt collections.json: missing ${label}.`);
  }
  const value = groups[key];
  if (!Array.isArray(value) || value.some((id) => typeof id !== "string")) {
    throw new Error(
      `Corrupt collections.json: ${label} must be an array of strings.`,
    );
  }
  return value;
}

function parseJsonFile<T>(filePath: string, label: string): T {
  if (!existsSync(filePath)) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
  let text: string;
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    throw new Error(`Could not read ${label}.`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Corrupt ${label}: not valid JSON.`);
  }
}

function assertPhotosShape(value: unknown): PhotosFile {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Corrupt photos.json: expected an object of photographs.");
  }
  const photos = value as PhotosFile;
  for (const [id, photo] of Object.entries(photos)) {
    if (!photo || typeof photo !== "object" || Array.isArray(photo)) {
      throw new Error(`Corrupt photos.json: photograph “${id}” is not an object.`);
    }
    if (typeof photo.title !== "string" || typeof photo.src !== "string") {
      throw new Error(
        `Corrupt photos.json: photograph “${id}” needs string title and src.`,
      );
    }
    if (
      photo.displayScale != null &&
      (typeof photo.displayScale !== "number" || !Number.isFinite(photo.displayScale))
    ) {
      throw new Error(
        `Corrupt photos.json: photograph “${id}” has an invalid displayScale.`,
      );
    }
  }
  return photos;
}

function assertCollectionsShape(value: unknown): CollectionsFile {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Corrupt collections.json: expected fatni/ayoub objects.");
  }
  const cols = value as CollectionsFile;
  if (!cols.fatni || typeof cols.fatni !== "object" || Array.isArray(cols.fatni)) {
    throw new Error("Corrupt collections.json: missing fatni collections.");
  }
  if (!cols.ayoub || typeof cols.ayoub !== "object" || Array.isArray(cols.ayoub)) {
    throw new Error("Corrupt collections.json: missing ayoub collections.");
  }
  for (const key of REQUIRED_FATNI) {
    requiredIds(cols.fatni, key, `fatni.${key}`);
  }
  for (const key of REQUIRED_AYOUB) {
    requiredIds(cols.ayoub, key, `ayoub.${key}`);
  }
  for (const [site, groups] of [
    ["fatni", cols.fatni],
    ["ayoub", cols.ayoub],
  ] as const) {
    for (const [key, ids] of Object.entries(groups)) {
      if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
        throw new Error(
          `Corrupt collections.json: ${site}.${key} must be an array of strings.`,
        );
      }
    }
  }
  return cols;
}

export function serializePhotosJson(draft: CatalogDraft): string {
  return `${JSON.stringify(photosFromCurator(draft.photos), null, 2)}\n`;
}

export function serializeCollectionsJson(draft: CatalogDraft): string {
  return `${JSON.stringify(collectionsFromCurator(draft.collections), null, 2)}\n`;
}

export function readCatalogFromDisk(projectRoot = repoRoot()): CatalogDraft {
  const paths = catalogPaths(projectRoot);
  const photos = assertPhotosShape(
    parseJsonFile<unknown>(paths.photos, "photos.json"),
  );
  const nested = assertCollectionsShape(
    parseJsonFile<unknown>(paths.collections, "collections.json"),
  );
  return {
    photos: photosToCurator(photos),
    collections: collectionsToCurator({
      fatni: {
        nature: requiredIds(nested.fatni, "nature", "fatni.nature"),
        urban: requiredIds(nested.fatni, "urban", "fatni.urban"),
        astro: requiredIds(nested.fatni, "astro", "fatni.astro"),
        street: requiredIds(nested.fatni, "street", "fatni.street"),
        monochrome: requiredIds(nested.fatni, "monochrome", "fatni.monochrome"),
      },
      ayoub: {
        afterDark: requiredIds(nested.ayoub, "afterDark", "ayoub.afterDark"),
        monochrome: requiredIds(nested.ayoub, "monochrome", "ayoub.monochrome"),
      },
    }),
  };
}

function writeTemp(filePath: string, contents: string): string {
  mkdirSync(dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, contents, "utf8");
  return tmp;
}

function restoreFromBackup(filePath: string, backupPath: string | null) {
  if (backupPath && existsSync(backupPath)) {
    copyFileSync(backupPath, filePath);
    return;
  }
  if (existsSync(filePath)) rmSync(filePath, { force: true });
}

function isFile(filePath: string): boolean {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

export function writeCatalogFiles(
  draft: CatalogDraft,
  projectRoot = repoRoot(),
  options?: { skipFiles?: boolean },
): void {
  const issues = validateCatalog(draft, {
    projectRoot,
    skipFiles: options?.skipFiles,
  });
  if (issues.length) {
    throw new Error(
      `Refusing to write an invalid catalogue: ${issues.map((issue) => issue.message).join(" ")}`,
    );
  }

  const paths = catalogPaths(projectRoot);
  const photosText = serializePhotosJson(draft);
  const collectionsText = serializeCollectionsJson(draft);

  let photosParsed: unknown;
  let collectionsParsed: unknown;
  try {
    photosParsed = JSON.parse(photosText);
    collectionsParsed = JSON.parse(collectionsText);
  } catch {
    throw new Error("Refusing to write catalogue: serializer produced invalid JSON.");
  }
  assertPhotosShape(photosParsed);
  assertCollectionsShape(collectionsParsed);

  const photosTmp = writeTemp(paths.photos, photosText);
  const collectionsTmp = writeTemp(paths.collections, collectionsText);

  try {
    assertPhotosShape(parseJsonFile<unknown>(photosTmp, "photos.json.tmp"));
    assertCollectionsShape(
      parseJsonFile<unknown>(collectionsTmp, "collections.json.tmp"),
    );
  } catch (error) {
    rmSync(photosTmp, { force: true });
    rmSync(collectionsTmp, { force: true });
    throw error;
  }

  const photosBak = isFile(paths.photos) ? `${paths.photos}.bak` : null;
  const collectionsBak = isFile(paths.collections)
    ? `${paths.collections}.bak`
    : null;

  try {
    if (photosBak) copyFileSync(paths.photos, photosBak);
    if (collectionsBak) copyFileSync(paths.collections, collectionsBak);
    renameSync(photosTmp, paths.photos);
    try {
      renameSync(collectionsTmp, paths.collections);
    } catch (error) {
      restoreFromBackup(paths.photos, photosBak);
      throw error;
    }
  } catch (error) {
    restoreFromBackup(paths.photos, photosBak);
    restoreFromBackup(paths.collections, collectionsBak);
    rmSync(photosTmp, { force: true });
    rmSync(collectionsTmp, { force: true });
    throw error;
  } finally {
    if (photosBak) rmSync(photosBak, { force: true });
    if (collectionsBak) rmSync(collectionsBak, { force: true });
  }
}

export { catalogPaths, repoRoot };
