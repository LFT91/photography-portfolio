import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { NextResponse } from "next/server";
import { addToCollection, cloneDraft } from "@/lib/admin/draft";
import { getMastersStatus } from "@/lib/admin/masters";
import { allocatePhotoId } from "@/lib/admin/photo-id";
import { readCatalogFromDisk } from "@/lib/admin/catalog-writer";
import {
  forbiddenOrNull,
  jsonError,
  readManifest,
  saveDraft,
} from "@/lib/admin/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function runGenerate(id: string, input: string) {
  return new Promise<{ ok: boolean; output: string }>((resolvePromise) => {
    const child = spawn(
      process.execPath,
      ["scripts/generate-images.mjs", "--id", id, "--input", input],
      { cwd: process.cwd(), env: process.env },
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

export async function GET(request: Request) {
  const forbidden = forbiddenOrNull(request);
  if (forbidden) return forbidden;
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(request: Request) {
  const forbidden = forbiddenOrNull(request);
  if (forbidden) return forbidden;

  const masters = getMastersStatus();
  if (!masters.ok) {
    return NextResponse.json(
      { error: "Add Photograph is disabled", reason: masters.reason },
      { status: 409 },
    );
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
  if (!collectionId) return jsonError("Choose a collection.");

  const current = readCatalogFromDisk();
  const existingIds = new Set(current.photos.map((photo) => photo.id));
  const id = allocatePhotoId(
    `${title} ${file.name.replace(/\.[^.]+$/, "")}`,
    existingIds,
  );
  const ext = extname(file.name).toLowerCase() || ".jpg";
  const masterPath = resolve(masters.dir, `${id}${ext}`);

  try {
    mkdirSync(masters.dir, { recursive: true });
    writeFileSync(masterPath, Buffer.from(await file.arrayBuffer()), {
      flag: "wx",
    });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error
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

  const generated = await runGenerate(id, masterPath);
  if (!generated.ok) {
    return jsonError(`Could not generate derivatives: ${generated.output}`);
  }

  let src = `/images/generated/${id}/1800.jpg`;
  try {
    const parsed = JSON.parse(generated.output) as { src?: string };
    if (parsed.src) src = parsed.src;
  } catch {
    const manifest = readManifest();
    src = manifest.photos[id]?.src ?? src;
  }

  const position = Number.parseInt(positionRaw, 10);
  const displayScale = Number.parseFloat(scaleRaw);
  const draft = cloneDraft(current.photos, current.collections);
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
