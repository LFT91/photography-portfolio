import { NextResponse } from "next/server";

/**
 * Local curator only: next dev on a loopback host, never Vercel.
 * Production / preview deployments must not mutate the filesystem.
 */
export function isLocalCuratorEnabled(): boolean {
  if (process.env.VERCEL) return false;
  if (process.env.NODE_ENV !== "development") return false;
  return true;
}

export function isLoopbackHost(hostHeader: string | null): boolean {
  const host = (hostHeader ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  const hostname = host.replace(/^\[/, "").replace(/\]:\d+$/, "").replace(/:\d+$/, "");
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0:0:0:0:0:0:0:1"
  );
}

export function localCuratorForbiddenResponse(): NextResponse {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export function assertLocalCuratorRequest(
  request: Request,
): NextResponse | null {
  if (!isLocalCuratorEnabled()) return localCuratorForbiddenResponse();
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!isLoopbackHost(host)) return localCuratorForbiddenResponse();
  return null;
}
