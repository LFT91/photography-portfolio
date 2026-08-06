"use client";

import { FormEvent, useRef, useState } from "react";
import { categories as workCategories, type PhotoCategory } from "@/data/photos";
import { useAdmin } from "@/components/AdminProvider";

const ALL_CATEGORIES: PhotoCategory[] = [...workCategories, "After Dark"];

export function SiteAdminBar() {
  const { ready, user, editing, setEditing, signOut, uploadPhoto } = useAdmin();
  const [openUpload, setOpenUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<PhotoCategory[]>([
    "Nature",
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!ready || !user) return null;

  const pickFiles = (list: FileList | null) => {
    const next = list?.[0];
    if (!next) return;
    if (!next.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setFile(next);
    if (!title.trim()) {
      setTitle(next.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    }
  };

  const onUpload = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Choose a photo first.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    const err = await uploadPhoto(file, title, selectedCategories);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setTitle("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedCategories(["Nature"]);
    setMessage("Uploaded.");
    setOpenUpload(false);
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-line bg-ink/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <p className="font-brand text-xs tracking-[0.12em] text-ember uppercase">
            Editing site
          </p>
          <p className="hidden font-brand text-sm text-fog sm:block">
            {user.email}
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(!editing)}
              className={`border px-3 py-2 font-brand text-sm tracking-[0.06em] transition-colors ${
                editing
                  ? "border-ember text-ember"
                  : "border-line text-paper-dim hover:text-paper"
              }`}
            >
              {editing ? "Edit on" : "Edit off"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenUpload((v) => !v);
                setMessage(null);
                setError(null);
              }}
              className="border border-line px-3 py-2 font-brand text-sm text-paper transition-colors hover:border-fog"
            >
              Upload
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
        {message ? (
          <p className="mx-auto mt-2 max-w-7xl font-brand text-sm text-paper-dim">
            {message}
          </p>
        ) : null}
      </div>

      {openUpload ? (
        <div className="fixed inset-0 z-[75] flex items-end justify-center bg-ink/70 p-4 sm:items-center">
          <form
            onSubmit={onUpload}
            className="w-full max-w-lg border border-line bg-ink p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl italic text-paper">
                Upload to gallery
              </h2>
              <button
                type="button"
                onClick={() => setOpenUpload(false)}
                className="font-brand text-sm text-fog hover:text-paper"
              >
                Close
              </button>
            </div>

            <label className="mt-5 block">
              <span className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
                Title
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-2 w-full border border-line bg-transparent px-4 py-3 font-brand text-paper outline-none focus:border-ember"
              />
            </label>

            <div className="mt-4">
              <span className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
                Image
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => pickFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  pickFiles(e.dataTransfer.files);
                }}
                className={`mt-2 flex w-full flex-col items-center justify-center gap-2 border border-dashed px-4 py-8 text-center transition-colors ${
                  dragOver
                    ? "border-ember bg-ember/10 text-ember"
                    : "border-line text-paper-dim hover:border-fog hover:text-paper"
                }`}
              >
                {file ? (
                  <span className="font-brand text-sm text-paper">{file.name}</span>
                ) : (
                  <span className="font-brand text-sm">
                    Drop photo here, or click to browse
                  </span>
                )}
              </button>
            </div>

            <fieldset className="mt-4">
              <legend className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
                Categories
              </legend>
              <div className="mt-3 flex flex-wrap gap-4">
                {ALL_CATEGORIES.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-2 font-brand text-sm text-paper"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() =>
                        setSelectedCategories((prev) =>
                          prev.includes(category)
                            ? prev.filter((c) => c !== category)
                            : [...prev, category],
                        )
                      }
                    />
                    {category}
                  </label>
                ))}
              </div>
            </fieldset>

            {error ? (
              <p className="mt-4 font-brand text-sm text-ember">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="mt-5 border border-ember px-6 py-3 font-brand text-sm tracking-[0.08em] text-ember transition-colors hover:bg-ember/10 disabled:opacity-50"
            >
              {busy ? "Uploading…" : "Upload photo"}
            </button>
          </form>
        </div>
      ) : null}

      {/* spacer so content isn't hidden behind the bar */}
      <div className="h-16" aria-hidden />
    </>
  );
}
