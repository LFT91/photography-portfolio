#!/usr/bin/env node
/**
 * Generate web derivatives from photographic masters.
 *
 * Masters live in masters/images/ and are never overwritten.
 * This writes:
 *   public/images/<path>        display (~1800px long edge)
 *   public/images/tile/<path>   tile (~800px long edge)
 *   public/images/hero/startrails.jpg
 *   src/data/image-manifest.json
 *
 * Usage: npm run images
 */

import { mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mastersDir = path.join(root, "masters", "images");
const publicImages = path.join(root, "public", "images");
const manifestPath = path.join(root, "src", "data", "image-manifest.json");

const DISPLAY_EDGE = 1800;
const TILE_EDGE = 800;
const HERO_EDGE = 1600;
const DISPLAY_QUALITY = 84;
const TILE_QUALITY = 78;
const HERO_QUALITY = 72;

const HERO_SOURCE = "after-dark/startrails.jpg";
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

async function walk(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full, base)));
    } else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) {
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

async function writeJpeg(pipeline, dest, quality) {
  await mkdir(path.dirname(dest), { recursive: true });
  await pipeline.jpeg(jpegOptions(quality)).toFile(dest);
}

async function processFile(rel) {
  const src = path.join(mastersDir, rel);
  const ext = path.extname(rel);
  const jpegRel = rel.replace(/\.(png|webp|tif|tiff|jpeg)$/i, ".jpg");
  const keepRel = ext.toLowerCase() === ".jpg" ? rel : jpegRel;

  const image = sharp(src, { failOn: "none" });
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) {
    throw new Error(`No dimensions for ${rel}`);
  }

  const displayDest = path.join(publicImages, keepRel);
  const tileDest = path.join(publicImages, "tile", keepRel);

  await writeJpeg(
    sharp(src, { failOn: "none" }).rotate().resize({
      width: DISPLAY_EDGE,
      height: DISPLAY_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    }),
    displayDest,
    DISPLAY_QUALITY,
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
  );

  let hero = null;
  if (rel.replace(/\\/g, "/") === HERO_SOURCE) {
    const heroDest = path.join(publicImages, "hero", "startrails.jpg");
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
  const tileMeta = await sharp(tileDest).metadata();
  const catalogKey = `/images/${rel.replace(/\\/g, "/")}`;
  const displayKey = `/images/${keepRel.replace(/\\/g, "/")}`;

  return {
    catalogKey,
    displayKey,
    entry: {
      width,
      height,
      display: {
        src: displayKey,
        width: displayMeta.width ?? 0,
        height: displayMeta.height ?? 0,
      },
      tile: {
        src: `/images/tile/${keepRel.replace(/\\/g, "/")}`,
        width: tileMeta.width ?? 0,
        height: tileMeta.height ?? 0,
      },
      ...(hero ? { hero } : {}),
    },
  };
}

async function main() {
  if (!existsSync(mastersDir)) {
    throw new Error(
      `Missing ${mastersDir}. Move original photographs there first.`,
    );
  }

  const files = (await walk(mastersDir)).sort();
  if (!files.length) {
    throw new Error("No master photographs found.");
  }

  const manifest = {};
  let failed = 0;

  for (const rel of files) {
    try {
      const { catalogKey, displayKey, entry } = await processFile(rel);
      manifest[catalogKey] = entry;
      if (displayKey !== catalogKey) {
        manifest[displayKey] = entry;
      }
      process.stdout.write(`ok  ${rel}\n`);
    } catch (err) {
      failed += 1;
      process.stderr.write(
        `fail ${rel}: ${err instanceof Error ? err.message : err}\n`,
      );
    }
  }

  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  if (failed) {
    throw new Error(`Image generation finished with ${failed} failure(s).`);
  }

  process.stdout.write(`Wrote ${files.length} photographs and ${manifestPath}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
