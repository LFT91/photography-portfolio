import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { forbiddenOrNull } from "@/lib/admin/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

async function runNpm(script: string) {
  try {
    const { stdout, stderr } = await execFileAsync("npm", ["run", script], {
      cwd: process.cwd(),
      env: process.env,
      timeout: 120_000,
    });
    return { ok: true, script, output: `${stdout}${stderr}`.trim() };
  } catch (error) {
    const err = error as {
      stdout?: string;
      stderr?: string;
      message?: string;
    };
    return {
      ok: false,
      script,
      output: `${err.stdout ?? ""}${err.stderr ?? err.message ?? ""}`.trim(),
    };
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

  const checks = [];
  for (const script of ["lint", "typecheck", "test"]) {
    checks.push(await runNpm(script));
  }

  let git = { ok: true, output: "" };
  try {
    const { stdout } = await execFileAsync("git", ["status", "--porcelain"], {
      cwd: process.cwd(),
    });
    git = { ok: true, output: stdout.trim() };
  } catch (error) {
    git = { ok: false, output: String(error) };
  }

  const ready = checks.every((check) => check.ok);
  return NextResponse.json({
    ready,
    checks,
    git: {
      clean: git.ok && git.output === "",
      porcelain: git.output,
    },
  });
}
