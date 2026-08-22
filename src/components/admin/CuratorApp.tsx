"use client";

import { useMemo, useState } from "react";
import { AddPhotograph } from "@/components/admin/AddPhotograph";
import { CuratorInspector } from "@/components/admin/CuratorInspector";
import { CuratorSidebar, type CuratorView } from "@/components/admin/CuratorSidebar";
import { CuratorWorkspace } from "@/components/admin/CuratorWorkspace";
import {
  addToCollection,
  draftSnapshot,
  moveToCollection,
  removeFromCollection,
  reorderInCollection,
  unassignedIds,
  updatePhoto,
} from "@/lib/admin/draft";
import type { CatalogDraft, CuratorCollection } from "@/lib/admin/types";
import type { PhotoDragPayload } from "@/components/admin/photo-drag";

export type CuratorPayload = CatalogDraft & {
  unassignedIds: string[];
  canUpload: boolean;
  uploadDisabledReason: string | null;
};

export function CuratorApp({ initial }: { initial: CuratorPayload }) {
  const [photos, setPhotos] = useState(initial.photos);
  const [collections, setCollections] = useState(initial.collections);
  const [saved, setSaved] = useState(
    draftSnapshot({ photos: initial.photos, collections: initial.collections }),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<CuratorView>({ kind: "all" });
  const [status, setStatus] = useState<"saved" | "dirty">("saved");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [readyNote, setReadyNote] = useState<string | null>(null);

  const dirty = draftSnapshot({ photos, collections }) !== saved;
  const photosById = useMemo(
    () => new Map(photos.map((photo) => [photo.id, photo])),
    [photos],
  );
  const selected = selectedId ? (photosById.get(selectedId) ?? null) : null;
  const unassigned = unassignedIds(photos, collections);
  const currentCollection =
    view.kind === "collection"
      ? (collections.find((item) => item.id === view.id) ?? null)
      : null;

  const workspaceIds =
    view.kind === "all"
      ? photos.map((photo) => photo.id)
      : view.kind === "unassigned"
        ? unassigned
        : (currentCollection?.photoIds ?? []);

  const workspaceTitle =
    view.kind === "all"
      ? "All photographs"
      : view.kind === "unassigned"
        ? "Unassigned"
        : (currentCollection?.title ?? "Collection");

  const applyCollections = (next: CuratorCollection[]) => {
    setCollections(next);
    setStatus("dirty");
  };

  const applyPayload = (payload: CuratorPayload) => {
    setPhotos(payload.photos);
    setCollections(payload.collections);
    setSaved(draftSnapshot(payload));
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

  const onDropOnCollection = (
    collectionId: string,
    payload: PhotoDragPayload,
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
    <div className="curator flex flex-col">
      <header className="curator-header">
        <div className="curator-brand">
          <h1 className="curator-title">Photography Curator</h1>
          <p className="curator-localhost">localhost only</p>
        </div>
        <div className="curator-header-actions">
          <p
            className={`curator-save-state${dirty ? " is-dirty" : " is-ok"}`}
          >
            {busy ? "Working" : dirty ? "Unsaved" : "Saved"}
          </p>
          <button
            type="button"
            disabled={!dirty || busy}
            onClick={() => void save()}
            className="curator-btn curator-btn-primary"
          >
            Save
          </button>
          <button
            type="button"
            disabled={busy || dirty}
            onClick={() => void checkReady()}
            className="curator-btn"
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
          {initial.canUpload ? null : (
            <p className="curator-hint">Master folder needs setup</p>
          )}
        </div>
      </header>
      {message || readyNote ? (
        <div className="curator-status">
          {message ? <p>{message}</p> : null}
          {readyNote ? <p>{readyNote}</p> : null}
        </div>
      ) : null}

      <div className="curator-shell">
        <CuratorSidebar
          photosCount={photos.length}
          unassignedCount={unassigned.length}
          collections={collections}
          view={view}
          onView={setView}
          onDropPhoto={(collectionId, payload, add) => {
            if (payload.fromCollectionId === collectionId && !add) return;
            onDropOnCollection(
              collectionId,
              payload,
              collections.find((item) => item.id === collectionId)?.photoIds
                .length ?? 0,
              add,
            );
          }}
        />

        <CuratorWorkspace
          title={workspaceTitle}
          count={workspaceIds.length}
          photoIds={workspaceIds}
          photosById={photosById}
          collections={collections}
          selectedId={selectedId}
          collectionId={currentCollection?.id ?? null}
          canReorder={view.kind === "collection"}
          onSelect={setSelectedId}
          onReorder={(from, to) => {
            if (!currentCollection) return;
            applyCollections(
              reorderInCollection(collections, currentCollection.id, from, to),
            );
          }}
          onDropPhoto={(payload, index, add) => {
            if (!currentCollection) return;
            onDropOnCollection(currentCollection.id, payload, index, add);
          }}
          onRemove={(photoId) => {
            if (!currentCollection) return;
            applyCollections(
              removeFromCollection(collections, currentCollection.id, photoId),
            );
          }}
          onMove={(photoId, toCollectionId) => {
            if (!currentCollection) return;
            applyCollections(
              moveToCollection(
                collections,
                photoId,
                currentCollection.id,
                toCollectionId,
              ),
            );
          }}
          onAdd={(photoId, toCollectionId) =>
            applyCollections(
              addToCollection(collections, toCollectionId, photoId),
            )
          }
          emptyLabel={
            view.kind === "unassigned"
              ? "Every photograph is in a collection."
              : view.kind === "all"
                ? "No photographs in the catalogue."
                : undefined
          }
        />

        <CuratorInspector
          photo={selected}
          collections={collections}
          currentCollectionId={currentCollection?.id ?? null}
          onTitle={(title) => {
            if (!selected) return;
            setPhotos(updatePhoto(photos, selected.id, { title }));
            setStatus("dirty");
          }}
          onDisplayScale={(displayScale) => {
            if (!selected) return;
            setPhotos(updatePhoto(photos, selected.id, { displayScale }));
            setStatus("dirty");
          }}
          onAdd={(collectionId) => {
            if (!selected) return;
            applyCollections(
              addToCollection(collections, collectionId, selected.id),
            );
          }}
          onMove={(collectionId) => {
            if (!selected || !currentCollection) return;
            applyCollections(
              moveToCollection(
                collections,
                selected.id,
                currentCollection.id,
                collectionId,
              ),
            );
          }}
          onRemoveFrom={(collectionId) => {
            if (!selected) return;
            applyCollections(
              removeFromCollection(collections, collectionId, selected.id),
            );
          }}
        />
      </div>
      <span className="sr-only">{status}</span>
    </div>
  );
}
