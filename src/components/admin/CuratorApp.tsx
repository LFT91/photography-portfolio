"use client";

import { useMemo, useState } from "react";
import type { CatalogCollection } from "@/content/collections";
import type { CatalogPhoto } from "@/content/photos";
import { SITE_IDS, type CatalogSite } from "@/content/sites";
import { AddPhotograph } from "@/components/admin/AddPhotograph";
import { CollectionBoard } from "@/components/admin/CollectionBoard";
import { PhotoLibrary } from "@/components/admin/PhotoLibrary";
import {
  addToCollection,
  draftSnapshot,
  moveToCollection,
  removeFromCollection,
  reorderInCollection,
  unassignedIds,
  updatePhoto,
} from "@/lib/admin/draft";

export type CuratorPayload = {
  photos: CatalogPhoto[];
  collections: CatalogCollection[];
  sites: readonly CatalogSite[];
  unassignedIds: string[];
  canUpload: boolean;
  uploadDisabledReason: string | null;
};

type DragPayload = {
  photoId: string;
  fromCollectionId: string | null;
};

export function CuratorApp({ initial }: { initial: CuratorPayload }) {
  const [photos, setPhotos] = useState(initial.photos);
  const [collections, setCollections] = useState(initial.collections);
  const [saved, setSaved] = useState(
    draftSnapshot(initial.photos, initial.collections),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<"saved" | "dirty">("saved");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [readyNote, setReadyNote] = useState<string | null>(null);

  const dirty = draftSnapshot(photos, collections) !== saved;
  const photosById = useMemo(
    () => new Map(photos.map((photo) => [photo.id, photo])),
    [photos],
  );
  const selected = selectedId ? photosById.get(selectedId) : null;
  const unassigned = unassignedIds(photos, collections);

  const applyCollections = (next: CatalogCollection[]) => {
    setCollections(next);
    setStatus("dirty");
  };

  const applyPayload = (payload: CuratorPayload) => {
    setPhotos(payload.photos);
    setCollections(payload.collections);
    setSaved(draftSnapshot(payload.photos, payload.collections));
    setStatus("saved");
  };

  const save = async () => {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ photos, collections }),
    });
    const json = (await response.json()) as CuratorPayload & {
      error?: string;
      issues?: { message: string }[];
    };
    setBusy(false);
    if (!response.ok) {
      setMessage(
        json.error ??
          json.issues?.map((issue) => issue.message).join(" ") ??
          "Save failed",
      );
      return;
    }
    applyPayload(json);
    setMessage("Saved to the local catalogue files. Nothing was pushed to Git.");
  };

  const checkReady = async () => {
    setBusy(true);
    setReadyNote(null);
    const response = await fetch("/api/admin/ready", { method: "POST" });
    const json = (await response.json()) as {
      ready?: boolean;
      checks?: { script: string; ok: boolean }[];
      git?: { clean: boolean };
      error?: string;
    };
    setBusy(false);
    if (!response.ok) {
      setReadyNote(json.error ?? "Ready check failed");
      return;
    }
    const failed = (json.checks ?? [])
      .filter((check) => !check.ok)
      .map((check) => check.script);
    if (json.ready) {
      setReadyNote(
        json.git?.clean
          ? "Ready to commit: lint, typecheck and tests passed; working tree is clean."
          : "Checks passed. The working tree has local changes — commit them yourself when you want to publish.",
      );
      return;
    }
    setReadyNote(`Not ready: ${failed.join(", ") || "checks failed"}.`);
  };

  const onDropPhoto = (
    collectionId: string,
    payload: DragPayload,
    index: number,
    add: boolean,
  ) => {
    if (payload.fromCollectionId === collectionId) {
      const from = collections
        .find((item) => item.id === collectionId)
        ?.photoIds.indexOf(payload.photoId);
      if (from == null || from < 0) return;
      applyCollections(
        reorderInCollection(collections, collectionId, from, index),
      );
      return;
    }
    if (payload.fromCollectionId && !add) {
      applyCollections(
        moveToCollection(
          collections,
          payload.photoId,
          payload.fromCollectionId,
          collectionId,
          index,
        ),
      );
      return;
    }
    applyCollections(
      addToCollection(collections, collectionId, payload.photoId, index),
    );
  };

  return (
    <div className="flex min-h-svh flex-col bg-ink text-paper">
      <header className="border-b border-line px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-brand text-[11px] tracking-[0.14em] text-fog uppercase">
              Local curator · localhost only
            </p>
            <h1 className="font-display text-3xl italic">Catalogue</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`font-brand text-xs tracking-[0.08em] ${
                dirty ? "text-ember" : "text-fog"
              }`}
            >
              {busy ? "Working…" : dirty ? "Unsaved" : "Saved"}
            </p>
            <button
              type="button"
              disabled={!dirty || busy}
              onClick={() => void save()}
              className="border border-paper px-3 py-1.5 font-brand text-sm text-paper disabled:opacity-40"
            >
              Save
            </button>
            <button
              type="button"
              disabled={busy || dirty}
              onClick={() => void checkReady()}
              className="border border-line px-3 py-1.5 font-brand text-sm text-paper disabled:opacity-40"
            >
              Ready to publish
            </button>
            <AddPhotograph
              collections={collections}
              disabledReason={
                initial.canUpload ? null : initial.uploadDisabledReason
              }
              onUploaded={(payload) => {
                applyPayload(payload as CuratorPayload);
                setMessage("Photograph added to the local catalogue.");
              }}
            />
          </div>
        </div>
        {message ? (
          <p className="mt-2 font-brand text-sm text-fog">{message}</p>
        ) : null}
        {readyNote ? (
          <p className="mt-1 font-brand text-sm text-fog">{readyNote}</p>
        ) : null}
        <p className="mt-2 max-w-3xl font-brand text-xs leading-relaxed text-fog">
          Drag within a collection to reorder. Drag between collections to move.
          Hold Option/Alt while dropping to add without removing the original
          membership. Save writes src/content files only — it does not push to
          GitHub.
        </p>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[20rem_minmax(0,1fr)_18rem]">
        <PhotoLibrary
          photos={photos}
          unassignedIds={unassigned}
          collections={collections}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAddToCollection={(photoId, collectionId) =>
            applyCollections(addToCollection(collections, collectionId, photoId))
          }
          onDragStart={() => undefined}
        />

        <div className="flex min-w-0 gap-3 overflow-x-auto pb-2">
          {[...collections]
            .sort((a, b) => {
              if (a.siteId !== b.siteId) {
                return a.siteId === SITE_IDS.FATNI ? -1 : 1;
              }
              return a.sortOrder - b.sortOrder;
            })
            .map((collection) => (
            <CollectionBoard
              key={collection.id}
              collection={collection}
              collections={collections}
              photosById={photosById}
              onReorder={(from, to) =>
                applyCollections(
                  reorderInCollection(collections, collection.id, from, to),
                )
              }
              onDropPhoto={(payload, index, add) =>
                onDropPhoto(collection.id, payload, index, add)
              }
              onRemove={(photoId) =>
                applyCollections(
                  removeFromCollection(collections, collection.id, photoId),
                )
              }
              onMove={(photoId, toCollectionId) =>
                applyCollections(
                  moveToCollection(
                    collections,
                    photoId,
                    collection.id,
                    toCollectionId,
                  ),
                )
              }
              onAdd={(photoId, toCollectionId) =>
                applyCollections(
                  addToCollection(collections, toCollectionId, photoId),
                )
              }
            />
          ))}
        </div>

        <aside className="border border-line bg-ink-soft/30 p-3">
          <h2 className="font-display text-xl italic">Photograph</h2>
          {selected ? (
            <div className="mt-3 space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.src}
                alt={selected.title}
                className="max-h-64 w-full object-contain"
              />
              <label className="block font-brand text-sm text-fog">
                Title
                <input
                  value={selected.title}
                  onChange={(event) => {
                    setPhotos(
                      updatePhoto(photos, selected.id, {
                        title: event.target.value,
                      }),
                    );
                    setStatus("dirty");
                  }}
                  className="mt-1 w-full border border-line bg-transparent px-2 py-1 text-paper"
                />
              </label>
              <label className="block font-brand text-sm text-fog">
                displayScale
                <input
                  type="number"
                  min={0.45}
                  max={3}
                  step={0.01}
                  value={selected.displayScale ?? 1}
                  onChange={(event) => {
                    const value = Number.parseFloat(event.target.value);
                    setPhotos(
                      updatePhoto(photos, selected.id, {
                        displayScale: Number.isFinite(value) ? value : 1,
                      }),
                    );
                    setStatus("dirty");
                  }}
                  className="mt-1 w-full border border-line bg-transparent px-2 py-1 text-paper"
                />
              </label>
              <p className="break-all font-brand text-[11px] text-fog">
                {selected.id}
              </p>
            </div>
          ) : (
            <p className="mt-3 font-brand text-sm text-fog">
              Select a photograph in the library to edit title and displayScale.
            </p>
          )}
        </aside>
      </div>
      <span className="sr-only">{status}</span>
    </div>
  );
}
