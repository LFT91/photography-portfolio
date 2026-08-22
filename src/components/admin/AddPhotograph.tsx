"use client";

import { useEffect, useMemo, useState } from "react";
import type { CuratorCollection } from "@/lib/admin/types";
import { collectionOptionLabel } from "@/components/admin/photo-drag";

export function AddPhotograph({
  collections,
  mastersArchiveLabel,
  onUploaded,
}: {
  collections: CuratorCollection[];
  mastersArchiveLabel: string;
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

  const collection = useMemo(
    () => collections.find((item) => item.id === collectionId),
    [collectionId, collections],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
    if (!file) return;
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
    <>
      <button
        type="button"
        className="curator-btn"
        onClick={() => setOpen(true)}
      >
        Add Photograph
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="curator-backdrop"
            aria-label="Close Add Photograph"
            onClick={() => setOpen(false)}
          />
          <aside className="curator-drawer" role="dialog" aria-labelledby="add-photo-title">
            <h2 id="add-photo-title">Add Photograph</h2>
            <p className="curator-drawer-help">
              Originals are safely copied to {mastersArchiveLabel}.
            </p>
            <label className="curator-field">
              <span>Image</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/tiff,.jpg,.jpeg,.png,.webp,.tif,.tiff"
                onChange={(event) => onFile(event.target.files?.[0] ?? null)}
              />
            </label>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Selected photograph preview"
                className="curator-drawer-preview"
              />
            ) : null}
            <label className="curator-field">
              <span>Title</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="curator-field">
              <span>Collection</span>
              <select
                value={collectionId}
                onChange={(event) => setCollectionId(event.target.value)}
              >
                {collections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {collectionOptionLabel(item.site, item.title)}
                  </option>
                ))}
              </select>
            </label>
            <label className="curator-field">
              <span>
                Position (0 = first, blank = end
                {collection ? `, ${collection.photoIds.length} current` : ""})
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={position}
                onChange={(event) => setPosition(event.target.value)}
              />
            </label>
            <label className="curator-field">
              <span>displayScale (optional)</span>
              <input
                type="text"
                value={displayScale}
                placeholder="1"
                onChange={(event) => setDisplayScale(event.target.value)}
              />
            </label>
            {error ? <p className="curator-error">{error}</p> : null}
            <div className="curator-drawer-actions">
              <button
                type="button"
                className="curator-btn curator-btn-quiet"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file || !title || busy}
                className="curator-btn curator-btn-primary"
                onClick={() => void submit()}
              >
                {busy ? "Adding…" : "Add to catalogue"}
              </button>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
