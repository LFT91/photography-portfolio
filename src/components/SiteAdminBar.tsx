"use client";

import { useAdmin } from "@/components/AdminProvider";

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
    discardDraft,
  } = useAdmin();

  if (!ready || !user) return null;

  const onCancel = () => {
    if (!dirty) {
      setEditing(false);
      return;
    }
    if (window.confirm("Discard all unsaved edits?")) {
      discardDraft();
    }
  };

  const onSave = async () => {
    const err = await saveDraft();
    if (!err) {
      // stay in edit mode so you can keep going; draft is clear
    }
  };

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
                  disabled={!dirty || saving}
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
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditing(false)}
                  className="border border-line px-3 py-2 font-brand text-sm text-paper-dim transition-colors hover:text-paper disabled:opacity-40"
                >
                  Done
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
            Changes stay local until you Save. Cancel reverts everything.
          </p>
        ) : null}
      </div>
      <div className="h-16" aria-hidden />
    </>
  );
}
