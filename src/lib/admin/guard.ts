import { NextResponse } from "next/server";

/**
 * Local curator: `npm run curate` sets CURATOR=1 and binds 127.0.0.1.
 * Production, Vercel, and ordinary `next dev` must not mutate the catalogue.
 */
export function isLocalCuratorEnabled(): boolean {
  if (process.env.VERCEL) return false;
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.CURATOR !== "1") return false;
  return true;
}

export function isLoopbackHost(hostHeader: string | null): boolean {
  const host = (hostHeader ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  const hostname = host
    .replace(/^\[/, "")
    .replace(/\]:\d+$/, "")
    .replace(/:\d+$/, "");
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0:0:0:0:0:0:0:1"
  );
}

function forwardedLooksRemote(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return false;
  const first = forwarded.split(",")[0]?.trim() ?? "";
  return first !== "" && !isLoopbackHost(first);
}

export function localCuratorForbiddenResponse(): NextResponse {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export function assertLocalCuratorRequest(
  request: Request,
): NextResponse | null {
  if (!isLocalCuratorEnabled()) return localCuratorForbiddenResponse();
  if (forwardedLooksRemote(request)) return localCuratorForbiddenResponse();
  if (!isLoopbackHost(request.headers.get("host"))) {
    return localCuratorForbiddenResponse();
  }
  return null;
}
