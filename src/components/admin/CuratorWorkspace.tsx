"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CuratorCollection, CuratorPhoto } from "@/lib/admin/types";
import { CuratorThumb } from "@/components/admin/CuratorThumb";
import {
  collectionOptionLabel,
  readPhotoDrag,
  setPhotoDrag,
  type PhotoDragPayload,
} from "@/components/admin/photo-drag";

export function CuratorWorkspace({
  title,
  count,
  photoIds,
  photosById,
  collections,
  selectedId,
  collectionId,
  canReorder,
  onSelect,
  onReorder,
  onDropPhoto,
  onRemove,
  onMove,
  onAdd,
  emptyLabel,
}: {
  title: string;
  count: number;
  photoIds: string[];
  photosById: Map<string, CuratorPhoto>;
  collections: CuratorCollection[];
  selectedId: string | null;
  collectionId: string | null;
  canReorder: boolean;
  onSelect: (id: string | null) => void;
  onReorder: (from: number, to: number) => void;
  onDropPhoto: (payload: PhotoDragPayload, index: number, add: boolean) => void;
  onRemove: (photoId: string) => void;
  onMove: (photoId: string, toCollectionId: string) => void;
  onAdd: (photoId: string, toCollectionId: string) => void;
  emptyLabel?: string;
}) {
  const countLabel = `${count} ${count === 1 ? "photograph" : "photographs"}`;

  return (
    <section className="curator-workspace">
      <header className="curator-workspace-head">
        <h2>{title}</h2>
        <p>{countLabel}</p>
      </header>
      <div
        className="curator-grid-scroll"
        onClick={() => onSelect(null)}
        onDragOver={(event) => {
          if (!collectionId) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = event.altKey ? "copy" : "move";
        }}
        onDrop={(event) => {
          if (!collectionId) return;
          event.preventDefault();
          const payload = readPhotoDrag(event.dataTransfer);
          if (!payload) return;
          onDropPhoto(payload, photoIds.length, event.altKey);
        }}
      >
        {photoIds.length === 0 ? (
          <p className="curator-empty">
            {emptyLabel ??
              (collectionId
                ? "This collection is empty. Drop a photograph here, or add one from the inspector."
                : "Nothing to show in this view.")}
          </p>
        ) : (
          <ul className="curator-grid">
            {photoIds.map((photoId, index) => {
              const photo = photosById.get(photoId);
              if (!photo) return null;
              return (
                <li key={`${collectionId ?? "lib"}-${photoId}-${index}`}>
                  <PhotoCard
                    photo={photo}
                    index={index}
                    selected={selectedId === photoId}
                    canReorder={canReorder}
                    isLast={index === photoIds.length - 1}
                    collectionId={collectionId}
                    collections={collections}
                    onSelect={() => onSelect(photoId)}
                    onReorder={onReorder}
                    onDropAt={(payload, add) =>
                      onDropPhoto(payload, index, add)
                    }
                    onRemove={() => onRemove(photoId)}
                    onMove={(to) => onMove(photoId, to)}
                    onAdd={(to) => onAdd(photoId, to)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function PhotoCard({
  photo,
  index,
  selected,
  canReorder,
  isLast,
  collectionId,
  collections,
  onSelect,
  onReorder,
  onDropAt,
  onRemove,
  onMove,
  onAdd,
}: {
  photo: CuratorPhoto;
  index: number;
  selected: boolean;
  canReorder: boolean;
  isLast: boolean;
  collectionId: string | null;
  collections: CuratorCollection[];
  onSelect: () => void;
  onReorder: (from: number, to: number) => void;
  onDropAt: (payload: PhotoDragPayload, add: boolean) => void;
  onRemove: () => void;
  onMove: (toCollectionId: string) => void;
  onAdd: (toCollectionId: string) => void;
}) {
  const [dropping, setDropping] = useState(false);
  const others = collections.filter((item) => item.id !== collectionId);

  return (
    <article
      draggable
      className={`curator-card${selected ? " is-selected" : ""}${dropping ? " is-drop" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onDragStart={(event) => {
        if ((event.target as HTMLElement).closest(".curator-menu-wrap")) {
          event.preventDefault();
          return;
        }
        setPhotoDrag(event.dataTransfer, {
          photoId: photo.id,
          fromCollectionId: collectionId,
        });
      }}
      onDragOver={(event) => {
        if (!collectionId) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = event.altKey ? "copy" : "move";
        setDropping(true);
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={(event) => {
        if (!collectionId) return;
        event.preventDefault();
        event.stopPropagation();
        setDropping(false);
        const payload = readPhotoDrag(event.dataTransfer);
        if (!payload) return;
        onDropAt(payload, event.altKey);
      }}
    >
      <div className="curator-frame">
        {canReorder ? (
          <span className="curator-pos">{String(index + 1).padStart(2, "0")}</span>
        ) : null}
        <CuratorThumb photo={photo} fit="contain" />
      </div>
      <div className="curator-card-caption">
        <p>{photo.title}</p>
        <PhotoOverflowMenu
          canReorder={canReorder}
          isFirst={index === 0}
          isLast={isLast}
          collectionId={collectionId}
          others={others}
          onMoveUp={() => onReorder(index, index - 1)}
          onMoveDown={() => onReorder(index, index + 1)}
          onRemove={onRemove}
          onMove={onMove}
          onAdd={onAdd}
        />
      </div>
    </article>
  );
}

function PhotoOverflowMenu({
  canReorder,
  isFirst,
  isLast,
  collectionId,
  others,
  onMoveUp,
  onMoveDown,
  onRemove,
  onMove,
  onAdd,
}: {
  canReorder: boolean;
  isFirst: boolean;
  isLast: boolean;
  collectionId: string | null;
  others: CuratorCollection[];
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onMove: (toCollectionId: string) => void;
  onAdd: (toCollectionId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"root" | "add" | "move">("root");
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="curator-menu-wrap" ref={rootRef}>
      <button
        type="button"
        className={`curator-icon-btn${open ? " is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Photograph actions"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          setPanel("root");
          setOpen((value) => !value);
        }}
      >
        ···
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="curator-menu"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {panel === "root" ? (
            <>
              {canReorder ? (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isFirst}
                    onClick={() => {
                      onMoveUp();
                      setOpen(false);
                    }}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isLast}
                    onClick={() => {
                      onMoveDown();
                      setOpen(false);
                    }}
                  >
                    Move down
                  </button>
                </>
              ) : null}
              <button
                type="button"
                role="menuitem"
                onClick={() => setPanel("add")}
              >
                Add to collection
              </button>
              {collectionId ? (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setPanel("move")}
                  >
                    Move to collection
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="is-danger"
                    onClick={() => {
                      onRemove();
                      setOpen(false);
                    }}
                  >
                    Remove from collection
                  </button>
                </>
              ) : null}
            </>
          ) : (
            <>
              <p className="curator-menu-label">
                {panel === "add" ? "Add to" : "Move to"}
              </p>
              {others.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    if (panel === "add") onAdd(item.id);
                    else onMove(item.id);
                    setOpen(false);
                  }}
                >
                  {collectionOptionLabel(item.site, item.title)}
                </button>
              ))}
              <button type="button" role="menuitem" onClick={() => setPanel("root")}>
                Back
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
