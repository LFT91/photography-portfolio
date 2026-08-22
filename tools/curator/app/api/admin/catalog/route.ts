import { NextResponse } from "next/server";
import {
  curatorPayload,
  forbiddenOrNull,
  jsonError,
  saveDraft,
} from "@/lib/admin/server";
import type { CatalogDraft } from "@/lib/admin/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const forbidden = forbiddenOrNull(request);
  if (forbidden) return forbidden;
  return NextResponse.json(curatorPayload());
}

export async function POST(request: Request) {
  const forbidden = forbiddenOrNull(request);
  if (forbidden) return forbidden;

  let body: CatalogDraft;
  try {
    body = (await request.json()) as CatalogDraft;
  } catch {
    return jsonError("Invalid JSON");
  }
  if (!Array.isArray(body?.photos) || !Array.isArray(body?.collections)) {
    return jsonError("Catalogue must include photos and collections arrays.");
  }

  const result = saveDraft(body);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.issues },
      { status: 400 },
    );
  }
  return NextResponse.json({ saved: true, ...result.payload });
}
