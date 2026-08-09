"use client";

import Link from "next/link";
import { useAdmin } from "@/components/AdminProvider";
import { isFatniSite } from "@/lib/site";

export function SiteAdminBar() {
  const {
    ready,
    user,
    editing,
    setEditing,
    signOut,
    dirty,
    saving,
    saveError,
    saveDraft,
  } = useAdmin();

  if (!ready || !user) return null;

  const onCancel = () => {
    setEditing(false);
  };

  const onSave = async () => {
    await saveDraft();
  };

  const showLibrary = isFatniSite();

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-line bg-ink/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <p className="font-brand text-xs tracking-[0.12em] text-ember uppercase">
            {editing ? (dirty ? "Unsaved edits" : "Editing") : "Admin"}
          </p>
          <p className="hidden font-brand text-sm text-fog sm:block">
            {user.email}
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {showLibrary ? (
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
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="border border-line px-3 py-2 font-brand text-sm text-paper-dim transition-colors hover:text-paper"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={onCancel}
                  className="border border-line px-3 py-2 font-brand text-sm text-paper-dim transition-colors hover:text-paper disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!dirty || saving}
                  onClick={() => void onSave()}
                  className="border border-ember px-3 py-2 font-brand text-sm text-ember transition-colors hover:bg-ember/10 disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </>
            )}
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
        {editing && dirty && !saveError ? (
          <p className="mx-auto mt-2 max-w-7xl font-brand text-sm text-fog">
            Changes stay local until you Save. Cancel discards and exits edit.
          </p>
        ) : null}
      </div>
      <div className="h-16" aria-hidden />
    </>
  );
}
