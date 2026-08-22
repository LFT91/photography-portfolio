"use client";

import { useMemo, useState } from "react";
import type { CuratorCollection } from "@/lib/admin/types";

export function AddPhotograph({
  collections,
  disabledReason,
  onUploaded,
}: {
  collections: CuratorCollection[];
  disabledReason: string | null;
  onUploaded: (payload: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const [position, setPosition] = useState("");
  const [displayScale, setDisplayScale] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = Boolean(disabledReason);

  const collection = useMemo(
    () => collections.find((item) => item.id === collectionId),
    [collectionId, collections],
  );

  const onFile = (next: File | null) => {
    setFile(next);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return next ? URL.createObjectURL(next) : null;
    });
    if (next && !title) {
      setTitle(next.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    }
  };

  const submit = async () => {
    if (!file || disabled) return;
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.set("file", file);
    body.set("title", title);
    body.set("collectionId", collectionId);
    if (position.trim()) body.set("position", position.trim());
    if (displayScale.trim()) body.set("displayScale", displayScale.trim());
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body,
    });
    const json = (await response.json()) as {
      error?: string;
      reason?: string;
    };
    setBusy(false);
    if (!response.ok) {
      setError(json.error ?? json.reason ?? "Upload failed");
      return;
    }
    onUploaded(json);
    setOpen(false);
    onFile(null);
    setTitle("");
    setPosition("");
    setDisplayScale("");
  };

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        title={disabledReason ?? undefined}
        onClick={() => setOpen(true)}
        className="border border-ember px-3 py-1.5 font-brand text-sm text-ember disabled:opacity-40"
      >
        Add Photograph
      </button>
      {disabled ? (
        <p className="mt-2 max-w-sm font-brand text-xs leading-relaxed text-fog">
          {disabledReason}
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/80 p-4">
          <div className="w-full max-w-lg border border-line bg-ink p-5">
            <h2 className="font-display text-2xl italic text-paper">
              Add Photograph
            </h2>
            <label className="mt-4 block font-brand text-sm text-fog">
              Image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/tiff,.jpg,.jpeg,.png,.webp,.tif,.tiff"
                className="mt-1 block w-full text-paper"
                onChange={(event) => onFile(event.target.files?.[0] ?? null)}
              />
            </label>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Selected photograph preview"
                className="mt-3 max-h-56 w-full object-contain"
              />
            ) : null}
            <label className="mt-3 block font-brand text-sm text-fog">
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full border border-line bg-transparent px-2 py-1 text-paper"
              />
            </label>
            <label className="mt-3 block font-brand text-sm text-fog">
              Collection
              <select
                value={collectionId}
                onChange={(event) => setCollectionId(event.target.value)}
                className="mt-1 w-full border border-line bg-ink px-2 py-1 text-paper"
              >
                {collections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.site === "fatni" ? "Fatni" : "Ayoub"} / {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block font-brand text-sm text-fog">
              Position (0 = first, blank = end
              {collection ? `, ${collection.photoIds.length} current` : ""})
              <input
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                inputMode="numeric"
                className="mt-1 w-full border border-line bg-transparent px-2 py-1 text-paper"
              />
            </label>
            <label className="mt-3 block font-brand text-sm text-fog">
              displayScale (optional)
              <input
                value={displayScale}
                onChange={(event) => setDisplayScale(event.target.value)}
                placeholder="1"
                className="mt-1 w-full border border-line bg-transparent px-2 py-1 text-paper"
              />
            </label>
            {error ? (
              <p className="mt-3 font-brand text-sm text-ember">{error}</p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="border border-line px-3 py-1.5 font-brand text-sm text-paper"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file || !title || busy}
                className="border border-ember px-3 py-1.5 font-brand text-sm text-ember disabled:opacity-40"
                onClick={() => void submit()}
              >
                {busy ? "Adding…" : "Add to catalogue"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
