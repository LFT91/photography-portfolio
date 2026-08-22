import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { NextResponse } from "next/server";
import { addToCollection, cloneDraft } from "@/lib/admin/draft";
import { ensureMastersDir } from "@/lib/admin/masters";
import { allocatePhotoId } from "@/lib/admin/photo-id";
import { readCatalogFromDisk } from "@/lib/admin/catalog-writer";
import { UPLOAD_FOLDER } from "@/lib/admin/shape";
import {
  forbiddenOrNull,
  jsonError,
  saveDraft,
} from "@/lib/admin/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);
const root = process.cwd();
const manifestPath = join(root, "src", "data", "image-manifest.json");
const publicImages = join(root, "public", "images");

function outputRelFor(rel: string) {
  return rel.replace(/\.(png|webp|tif|tiff|jpeg)$/i, ".jpg");
}

function publicRelsFor(masterRel: string) {
  const keepRel = outputRelFor(masterRel);
  return [keepRel, `small/${keepRel}`, `tile/${keepRel}`, `large/${keepRel}`];
}

function runGenerate(rel: string, mastersDir: string) {
  return new Promise<{ ok: boolean; output: string }>((resolvePromise) => {
    const child = spawn(
      process.execPath,
      ["scripts/generate-images.mjs", "--file", rel],
      {
        cwd: root,
        env: { ...process.env, MASTERS_DIR: mastersDir },
      },
    );
    let output = "";
    child.stdout?.on("data", (chunk) => {
      output += String(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      output += String(chunk);
    });
    child.on("error", (error) => {
      resolvePromise({ ok: false, output: String(error) });
    });
    child.on("close", (code) => {
      resolvePromise({ ok: code === 0, output: output.trim() });
    });
  });
}

function removePublicOutputs(masterRel: string) {
  for (const rel of publicRelsFor(masterRel)) {
    rmSync(join(publicImages, rel), { force: true });
  }
}

export async function GET(request: Request) {
  const forbidden = forbiddenOrNull(request);
  if (forbidden) return forbidden;
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(request: Request) {
  const forbidden = forbiddenOrNull(request);
  if (forbidden) return forbidden;

  const masters = ensureMastersDir();
  if (!masters.ok) {
    return jsonError(masters.reason, 409);
  }

  const form = await request.formData();
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  const collectionId = String(form.get("collectionId") ?? "").trim();
  const positionRaw = String(form.get("position") ?? "");
  const scaleRaw = String(form.get("displayScale") ?? "");

  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Choose an image file.");
  }
  if (!title) return jsonError("Title is required.");
  if (!collectionId || !UPLOAD_FOLDER[collectionId]) {
    return jsonError("Choose a collection.");
  }

  const ext = extname(file.name).toLowerCase();
  if (!IMAGE_EXT.has(ext)) {
    return jsonError("Use a JPEG, PNG, WebP or TIFF photograph.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isSupportedImage(buffer, ext)) {
    return jsonError("That file is not a readable JPEG, PNG, WebP or TIFF image.");
  }

  const current = readCatalogFromDisk();
  const existingIds = new Set(current.photos.map((photo) => photo.id));
  const id = allocatePhotoId(title, existingIds);
  const folder = UPLOAD_FOLDER[collectionId];
  const masterRel = `${folder}/${id}${ext}`;
  const masterPath = resolve(masters.dir, masterRel);
  const inside = relative(masters.dir, masterPath);
  if (
    !inside ||
    inside.startsWith("..") ||
    inside.split(/[\\/]/).includes("..") ||
    masterPath === masters.dir
  ) {
    return jsonError("Could not write the master file.");
  }
  const keepRel = outputRelFor(masterRel);
  const src = `/images/${keepRel}`;
  const previousManifest = existsSync(manifestPath)
    ? readFileSync(manifestPath, "utf8")
    : "";

  try {
    mkdirSync(resolve(masters.dir, folder), { recursive: true });
    writeFileSync(masterPath, buffer, { flag: "wx" });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    if (code === "EEXIST") {
      return jsonError(
        `A master already exists for “${id}”. The original was not overwritten.`,
        409,
      );
    }
    return jsonError("Could not write the master file.");
  }

  const generated = await runGenerate(masterRel, masters.dir);
  if (!generated.ok) {
    rmSync(masterPath, { force: true });
    removePublicOutputs(masterRel);
    restoreManifest(previousManifest);
    return jsonError(`Could not generate derivatives: ${generated.output}`);
  }

  const position = Number.parseInt(positionRaw, 10);
  const displayScale = Number.parseFloat(scaleRaw);
  const draft = cloneDraft(current);
  draft.photos.push({
    id,
    title,
    src,
    ...(Number.isFinite(displayScale) && displayScale > 0 && displayScale !== 1
      ? { displayScale }
      : {}),
  });
  draft.collections = addToCollection(
    draft.collections,
    collectionId,
    id,
    Number.isFinite(position) ? position : undefined,
  );

  const saved = saveDraft(draft);
  if (!saved.ok) {
    rmSync(masterPath, { force: true });
    removePublicOutputs(masterRel);
    restoreManifest(previousManifest);
    return NextResponse.json(
      { error: "Validation failed after upload", issues: saved.issues },
      { status: 400 },
    );
  }

  return NextResponse.json({
    uploaded: true,
    photoId: id,
    ...saved.payload,
  });
}

function isSupportedImage(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 12) return false;
  if (ext === ".jpg" || ext === ".jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (ext === ".png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (ext === ".webp") {
    return (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }
  if (ext === ".tif" || ext === ".tiff") {
    const header = buffer.toString("ascii", 0, 2);
    return header === "II" || header === "MM";
  }
  return false;
}

function restoreManifest(previous: string) {
  if (!previous) {
    rmSync(manifestPath, { force: true });
    return;
  }
  writeFileSync(manifestPath, previous, "utf8");
}
