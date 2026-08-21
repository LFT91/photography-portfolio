"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminProvider";
import { isFatniSite } from "@/lib/site";

export function AdminNav() {
  const pathname = usePathname();
  const { ready, user, signOut, dirty, saving, saveError, saveDraft } =
    useAdmin();

  if (!ready || !user || pathname === "/admin") return null;

  return (
    <div className="sticky top-0 z-[70] border-b border-line bg-ink/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        <p className="font-brand text-xs tracking-[0.12em] text-ember uppercase">
          Admin
        </p>
        <p className="hidden font-brand text-sm text-fog sm:block">
          {user.email}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="border border-line px-3 py-2 font-brand text-sm text-paper-dim transition-colors hover:text-paper"
          >
            View site
          </Link>
          {isFatniSite() ? (
            <Link
              href="/admin/library"
              className="border border-line px-3 py-2 font-brand text-sm text-paper-dim transition-colors hover:text-paper"
            >
              Library
            </Link>
          ) : null}
          <Link
            href="/admin/collections"
            className="border border-line px-3 py-2 font-brand text-sm text-paper-dim transition-colors hover:text-paper"
          >
            Collections
          </Link>
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => void saveDraft()}
            className="border border-ember px-3 py-2 font-brand text-sm text-ember transition-colors hover:bg-ember/10 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="border border-line px-3 py-2 font-brand text-sm text-paper-dim transition-colors hover:text-paper"
          >
            Sign out
          </button>
        </div>
      </div>
      {saveError ? (
        <p className="mx-auto mt-2 max-w-7xl font-brand text-sm text-ember">
          {saveError}
        </p>
      ) : null}
    </div>
  );
}
