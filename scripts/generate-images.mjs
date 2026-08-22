#!/usr/bin/env node
/**
 * Generate 480 / 800 / 1200 / 1800 JPEG derivatives for one photograph
 * and update src/data/image-manifest.json.
 *
 *   node scripts/generate-images.mjs --id coastal-moon --input /path/to/master.jpg
 *
 * Does not store masters in Git. Output lives under public/images/generated/.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = resolve(ROOT, "src/data/image-manifest.json");
const WIDTHS = [480, 800, 1200, 1800];

function parseArgs(argv) {
  const out = { id: "", input: "" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--id") out.id = argv[++i] ?? "";
    else if (arg === "--input") out.input = argv[++i] ?? "";
  }
  return out;
}

function readManifest() {
  const raw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  return {
    version: 1,
    widths: WIDTHS,
    photos: raw.photos && typeof raw.photos === "object" ? raw.photos : {},
  };
}

function atomicWriteJson(filePath, value) {
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(tmp, filePath);
}

async function generate({ id, input }) {
  if (!id || !input) {
    throw new Error("Usage: node scripts/generate-images.mjs --id <photoId> --input <master>");
  }
  const source = resolve(input);
  const image = sharp(source).rotate();
  const meta = await image.metadata();
  const derivatives = {};

  for (const width of WIDTHS) {
    const dir = resolve(ROOT, "public/images/generated", id);
    mkdirSync(dir, { recursive: true });
    const dest = resolve(dir, `${width}.jpg`);
    await sharp(source)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(dest);
    derivatives[String(width)] = `/images/generated/${id}/${width}.jpg`;
  }

  const displaySrc = derivatives["1800"] ?? derivatives["1200"] ?? derivatives["800"];
  const manifest = readManifest();
  manifest.photos[id] = {
    src: displaySrc,
    width: meta.width,
    height: meta.height,
    derivatives,
  };
  atomicWriteJson(MANIFEST_PATH, manifest);

  return {
    id,
    src: displaySrc,
    width: meta.width ?? null,
    height: meta.height ?? null,
    derivatives,
  };
}

const args = parseArgs(process.argv.slice(2));
const result = await generate(args);
process.stdout.write(`${JSON.stringify(result)}\n`);
