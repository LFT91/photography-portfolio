"use client";

import { useState, type DragEvent } from "react";
import type { CuratorCollection } from "@/lib/admin/types";
import {
  collectionOptionLabel,
  readPhotoDrag,
  type PhotoDragPayload,
} from "@/components/admin/photo-drag";

export type CuratorView =
  | { kind: "all" }
  | { kind: "unassigned" }
  | { kind: "collection"; id: string };

export function CuratorSidebar({
  photosCount,
  unassignedCount,
  collections,
  view,
  onView,
  onDropPhoto,
}: {
  photosCount: number;
  unassignedCount: number;
  collections: CuratorCollection[];
  view: CuratorView;
  onView: (view: CuratorView) => void;
  onDropPhoto: (
    collectionId: string,
    payload: PhotoDragPayload,
    add: boolean,
  ) => void;
}) {
  const [dropId, setDropId] = useState<string | null>(null);
  const fatni = collections.filter((item) => item.site === "fatni");
  const ayoub = collections.filter((item) => item.site === "ayoub");

  const dropHandlers = (collectionId: string) => ({
    onDragOver: (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = event.altKey ? "copy" : "move";
      setDropId(collectionId);
    },
    onDragLeave: () => {
      setDropId((current) => (current === collectionId ? null : current));
    },
    onDrop: (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setDropId(null);
      const payload = readPhotoDrag(event.dataTransfer);
      if (!payload) return;
      onDropPhoto(collectionId, payload, event.altKey);
    },
  });

  return (
    <nav className="curator-sidebar" aria-label="Library and collections">
      <p className="curator-nav-label">Library</p>
      <SidebarItem
        label="All photographs"
        count={photosCount}
        active={view.kind === "all"}
        onClick={() => onView({ kind: "all" })}
      />
      <SidebarItem
        label="Unassigned"
        count={unassignedCount}
        active={view.kind === "unassigned"}
        onClick={() => onView({ kind: "unassigned" })}
      />

      <p className="curator-nav-label">Fatni Photography</p>
      {fatni.map((collection) => (
        <SidebarItem
          key={collection.id}
          label={collection.title}
          count={collection.photoIds.length}
          active={view.kind === "collection" && view.id === collection.id}
          dropping={dropId === collection.id}
          title={`Drop to move here. Option/Alt-drop adds (${collectionOptionLabel(collection.site, collection.title)})`}
          onClick={() => onView({ kind: "collection", id: collection.id })}
          {...dropHandlers(collection.id)}
        />
      ))}

      <p className="curator-nav-label">Ayoub El Fatni</p>
      {ayoub.map((collection) => (
        <SidebarItem
          key={collection.id}
          label={collection.title}
          count={collection.photoIds.length}
          active={view.kind === "collection" && view.id === collection.id}
          dropping={dropId === collection.id}
          title={`Drop to move here. Option/Alt-drop adds (${collectionOptionLabel(collection.site, collection.title)})`}
          onClick={() => onView({ kind: "collection", id: collection.id })}
          {...dropHandlers(collection.id)}
        />
      ))}
    </nav>
  );
}

function SidebarItem({
  label,
  count,
  active,
  dropping = false,
  title,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  label: string;
  count: number;
  active: boolean;
  dropping?: boolean;
  title?: string;
  onClick: () => void;
  onDragOver?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragLeave?: () => void;
  onDrop?: (event: DragEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-current={active ? "page" : undefined}
      className={`curator-nav-item${active ? " is-active" : ""}${dropping ? " is-drop" : ""}`}
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <span>{label}</span>
      <span className="curator-nav-count">{count}</span>
    </button>
  );
}
