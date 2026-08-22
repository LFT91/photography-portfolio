#!/usr/bin/env node
/**
 * Generate web derivatives from photographic masters.
 *
 * Masters are never written. They live outside this repository.
 * Point MASTERS_DIR at the folder that contains after-dark/, nature/, …
 *
 * Writes:
 *   public/images/small/<path>   ~480px
 *   public/images/tile/<path>    ~800px
 *   public/images/large/<path>   ~1200px
 *   public/images/<path>         ~1800px (lightbox)
 *   public/images/hero/startrails.jpg
 *   src/data/image-manifest.json
 *
 * After a successful run, stale files under public/images/ are removed.
 * If any public catalogue photograph has no master, the run fails
 * before pruning.
 *
 * Usage:
 *   MASTERS_DIR=/path/to/masters/images npm run images
 *   MASTERS_DIR=/path/to/masters/images node scripts/generate-images.mjs --file nature/coastal-moon.jpg
 *
 * --file generates one photograph with the same processing as a full run.
 * It never prunes unrelated files.
 */

import {
  mkdir,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicImages = path.join(root, "public", "images");
const manifestPath = path.join(root, "src", "data", "image-manifest.json");
const catalogPath = path.join(root, "src", "content", "photos.ts");

const SMALL_EDGE = 480;
const TILE_EDGE = 800;
const LARGE_EDGE = 1200;
const DISPLAY_EDGE = 1800;
const HERO_EDGE = 1600;
const SMALL_QUALITY = 76;
const TILE_QUALITY = 78;
const LARGE_QUALITY = 80;
const DISPLAY_QUALITY = 84;
const HERO_QUALITY = 72;

const HERO_SOURCE = "after-dark/startrails.jpg";
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

function resolveMastersDir() {
  const fromEnv = process.env.MASTERS_DIR?.trim();
  const candidates = [fromEnv, path.join(root, "masters", "images")].filter(
    Boolean,
  );

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (existsSync(resolved)) return resolved;
  }

  throw new Error(
    "No photographic masters found. Set MASTERS_DIR to the directory that contains the original photographs (after-dark/, nature/, …). Masters are not stored in this repository.",
  );
}

function posixRel(rel) {
  return rel.split(path.sep).join("/");
}

function outputRelFor(rel) {
  const ext = path.extname(rel);
  const jpegRel = rel.replace(/\.(png|webp|tif|tiff|jpeg)$/i, ".jpg");
  return ext.toLowerCase() === ".jpg" ? rel : jpegRel;
}

function assertOutsideMasters(target, mastersDir) {
  const resolved = path.resolve(target);
  const masters = path.resolve(mastersDir);
  const prefix = masters.endsWith(path.sep) ? masters : `${masters}${path.sep}`;
  if (resolved === masters || resolved.startsWith(prefix)) {
    throw new Error(`Refusing to write inside masters: ${resolved}`);
  }
}

async function walk(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      files.push(...(await walk(full, base)));
    } else if (
      entry.isFile() &&
      IMAGE_EXT.has(path.extname(entry.name).toLowerCase())
    ) {
      files.push(path.relative(base, full));
    }
  }
  return files;
}

function jpegOptions(quality, chroma = "4:4:4") {
  return {
    quality,
    mozjpeg: true,
    chromaSubsampling: chroma,
  };
}

async function writeJpeg(pipeline, dest, quality, mastersDir) {
  assertOutsideMasters(dest, mastersDir);
  await mkdir(path.dirname(dest), { recursive: true });
  await pipeline.jpeg(jpegOptions(quality)).toFile(dest);
}

function catalogSrcs() {
  if (!existsSync(catalogPath)) {
    throw new Error(`Missing catalogue file: ${catalogPath}`);
  }
  const text = readFileSync(catalogPath, "utf8");
  return [...text.matchAll(/src:\s*"(\/images\/[^"]+)"/g)].map((match) => match[1]);
}

function expectedOutputs(masterRels) {
  const expected = new Set();
  for (const rel of masterRels) {
    const keepRel = posixRel(outputRelFor(rel));
    expected.add(keepRel);
    expected.add(posixRel(path.join("small", keepRel)));
    expected.add(posixRel(path.join("tile", keepRel)));
    expected.add(posixRel(path.join("large", keepRel)));
    if (posixRel(rel) === HERO_SOURCE) {
      expected.add(posixRel(path.join("hero", "startrails.jpg")));
    }
  }
  return expected;
}

async function processFile(mastersDir, rel) {
  const src = path.join(mastersDir, rel);
  const keepRel = outputRelFor(rel);

  const image = sharp(src, { failOn: "none" });
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) {
    throw new Error(`No dimensions for ${rel}`);
  }

  const displayDest = path.join(publicImages, keepRel);
  const smallDest = path.join(publicImages, "small", keepRel);
  const tileDest = path.join(publicImages, "tile", keepRel);
  const largeDest = path.join(publicImages, "large", keepRel);

  await writeJpeg(
    sharp(src, { failOn: "none" }).rotate().resize({
      width: DISPLAY_EDGE,
      height: DISPLAY_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    }),
    displayDest,
    DISPLAY_QUALITY,
    mastersDir,
  );
  await writeJpeg(
    sharp(src, { failOn: "none" }).rotate().resize({
      width: SMALL_EDGE,
      height: SMALL_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    }),
    smallDest,
    SMALL_QUALITY,
    mastersDir,
  );
  await writeJpeg(
    sharp(src, { failOn: "none" }).rotate().resize({
      width: TILE_EDGE,
      height: TILE_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    }),
    tileDest,
    TILE_QUALITY,
    mastersDir,
  );
  await writeJpeg(
    sharp(src, { failOn: "none" }).rotate().resize({
      width: LARGE_EDGE,
      height: LARGE_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    }),
    largeDest,
    LARGE_QUALITY,
    mastersDir,
  );

  let hero = null;
  if (posixRel(rel) === HERO_SOURCE) {
    const heroDest = path.join(publicImages, "hero", "startrails.jpg");
    assertOutsideMasters(heroDest, mastersDir);
    await mkdir(path.dirname(heroDest), { recursive: true });
    await sharp(src, { failOn: "none" })
      .rotate()
      .resize({
        width: HERO_EDGE,
        height: HERO_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg(jpegOptions(HERO_QUALITY, "4:2:0"))
      .toFile(heroDest);
    const heroMeta = await sharp(heroDest).metadata();
    hero = {
      src: "/images/hero/startrails.jpg",
      width: heroMeta.width ?? 0,
      height: heroMeta.height ?? 0,
    };
  }

  const displayMeta = await sharp(displayDest).metadata();
  const smallMeta = await sharp(smallDest).metadata();
  const tileMeta = await sharp(tileDest).metadata();
  const largeMeta = await sharp(largeDest).metadata();
  const catalogKey = `/images/${posixRel(rel)}`;
  const displayKey = `/images/${posixRel(keepRel)}`;

  return {
    catalogKey,
    displayKey,
    entry: {
      width,
      height,
      small: {
        src: `/images/small/${posixRel(keepRel)}`,
        width: smallMeta.width ?? 0,
        height: smallMeta.height ?? 0,
      },
      tile: {
        src: `/images/tile/${posixRel(keepRel)}`,
        width: tileMeta.width ?? 0,
        height: tileMeta.height ?? 0,
      },
      large: {
        src: `/images/large/${posixRel(keepRel)}`,
        width: largeMeta.width ?? 0,
        height: largeMeta.height ?? 0,
      },
      display: {
        src: displayKey,
        width: displayMeta.width ?? 0,
        height: displayMeta.height ?? 0,
      },
      ...(hero ? { hero } : {}),
    },
  };
}

async function pruneStale(expected) {
  if (!existsSync(publicImages)) return [];
  const publicRoot = realpathSync(publicImages);
  const allowed = realpathSync(path.join(root, "public", "images"));
  if (publicRoot !== allowed) {
    throw new Error(`Refusing to prune unexpected images directory: ${publicRoot}`);
  }

  const existing = await walk(publicImages);
  const removed = [];
  for (const rel of existing) {
    const posix = posixRel(rel);
    if (expected.has(posix)) continue;
    const full = path.join(publicImages, rel);
    assertOutsideMasters(full, path.join(root, "masters"));
    await rm(full);
    removed.push(posix);
    process.stdout.write(`rm  ${posix}\n`);
  }
  return removed;
}

async function removeEmptyDirs(dir) {
  if (!existsSync(dir)) return;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    await removeEmptyDirs(full);
  }
  const leftover = await readdir(dir);
  if (leftover.length === 0 && path.resolve(dir) !== path.resolve(publicImages)) {
    await rm(dir, { recursive: true });
  }
}

function masterKeys(files) {
  const keys = new Set();
  for (const rel of files) {
    keys.add(`/images/${posixRel(rel)}`);
    keys.add(`/images/${posixRel(outputRelFor(rel))}`);
  }
  return keys;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0) return { mode: "all" };
  if (args[0] === "--help" || args[0] === "-h") return { mode: "help" };
  if (args[0] === "--file") {
    const file = args[1]?.trim();
    if (!file || args.length !== 2) {
      throw new Error(
        "Usage: node scripts/generate-images.mjs --file <relative-master-path>",
      );
    }
    return { mode: "one", file };
  }
  throw new Error(
    `Unknown arguments: ${args.join(" ")}. Use no args for a full run, or --file <rel>.`,
  );
}

async function writeManifestAtomic(manifest) {
  const tmp = `${manifestPath}.tmp`;
  await writeFile(tmp, `${JSON.stringify(manifest, null, 2)}\n`);
  await rename(tmp, manifestPath);
}

function readManifest() {
  if (!existsSync(manifestPath)) return {};
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

async function generateOne(rel) {
  const mastersDir = resolveMastersDir();
  const mastersStat = await stat(mastersDir);
  if (!mastersStat.isDirectory()) {
    throw new Error(`MASTERS_DIR is not a directory: ${mastersDir}`);
  }

  const posix = posixRel(rel);
  const src = path.join(mastersDir, posix);
  if (!existsSync(src)) {
    throw new Error(`Master not found: ${src}`);
  }

  const { catalogKey, displayKey, entry } = await processFile(
    mastersDir,
    posix,
  );
  const manifest = readManifest();
  manifest[catalogKey] = entry;
  if (displayKey !== catalogKey) {
    manifest[displayKey] = entry;
  }

  assertOutsideMasters(manifestPath, mastersDir);
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeManifestAtomic(manifest);

  process.stdout.write(
    `ok  ${posix}\nWrote 1 photograph, ${Object.keys(manifest).length} manifest keys, ${manifestPath}\n`,
  );
}

async function main() {
  const parsed = parseArgs(process.argv);
  if (parsed.mode === "help") {
    process.stdout.write(
      "Usage:\n  npm run images\n  node scripts/generate-images.mjs --file <relative-master-path>\n",
    );
    return;
  }
  if (parsed.mode === "one") {
    await generateOne(parsed.file);
    return;
  }

  const mastersDir = resolveMastersDir();
  const mastersStat = await stat(mastersDir);
  if (!mastersStat.isDirectory()) {
    throw new Error(`MASTERS_DIR is not a directory: ${mastersDir}`);
  }

  const files = (await walk(mastersDir)).sort();
  if (!files.length) {
    throw new Error(
      `No master photographs found in ${mastersDir}. Refusing to generate or prune.`,
    );
  }

  const catalog = catalogSrcs();
  if (!catalog.length) {
    throw new Error(`No photograph src values found in ${catalogPath}.`);
  }

  const generatedKeys = masterKeys(files);
  const missing = catalog.filter((src) => !generatedKeys.has(src));
  if (missing.length) {
    throw new Error(
      `Catalogue photographs have no master; refusing to generate or prune.\nMissing:\n${missing.join("\n")}`,
    );
  }

  process.stdout.write(`masters ${mastersDir} (${files.length} files)\n`);

  const manifest = {};
  let failed = 0;

  for (const rel of files) {
    try {
      const { catalogKey, displayKey, entry } = await processFile(
        mastersDir,
        rel,
      );
      manifest[catalogKey] = entry;
      if (displayKey !== catalogKey) {
        manifest[displayKey] = entry;
      }
      process.stdout.write(`ok  ${posixRel(rel)}\n`);
    } catch (err) {
      failed += 1;
      process.stderr.write(
        `fail ${posixRel(rel)}: ${err instanceof Error ? err.message : err}\n`,
      );
    }
  }

  if (failed) {
    throw new Error(
      `Image generation finished with ${failed} failure(s). Manifest and prune were not applied.`,
    );
  }

  assertOutsideMasters(manifestPath, mastersDir);
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeManifestAtomic(manifest);

  const expected = expectedOutputs(files);
  const removed = await pruneStale(expected);
  await removeEmptyDirs(publicImages);

  process.stdout.write(
    `Wrote ${files.length} photographs, ${Object.keys(manifest).length} manifest keys, removed ${removed.length} stale file(s), ${manifestPath}\n`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
