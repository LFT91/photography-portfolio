"use client";

import { useMemo, useState } from "react";
import type { CatalogCollection } from "@/content/collections";
import type { CatalogPhoto } from "@/content/photos";
import { CuratorThumb } from "@/components/admin/CuratorThumb";

type DragPayload = {
  photoId: string;
  fromCollectionId: string | null;
};

export function PhotoLibrary({
  photos,
  unassignedIds,
  collections,
  selectedId,
  onSelect,
  onAddToCollection,
  onDragStart,
}: {
  photos: CatalogPhoto[];
  unassignedIds: string[];
  collections: CatalogCollection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddToCollection: (photoId: string, collectionId: string) => void;
  onDragStart: (payload: DragPayload) => void;
}) {
  const [filter, setFilter] = useState<"all" | "unassigned">("all");
  const unassigned = useMemo(
    () => new Set(unassignedIds),
    [unassignedIds],
  );
  const visible = photos.filter((photo) =>
    filter === "unassigned" ? unassigned.has(photo.id) : true,
  );

  return (
    <section className="flex min-h-0 flex-col border border-line bg-ink-soft/40">
      <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <h2 className="font-display text-xl italic text-paper">Library</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className={`font-brand text-xs tracking-[0.08em] ${
              filter === "all" ? "text-paper" : "text-fog"
            }`}
            onClick={() => setFilter("all")}
          >
            All ({photos.length})
          </button>
          <button
            type="button"
            className={`font-brand text-xs tracking-[0.08em] ${
              filter === "unassigned" ? "text-paper" : "text-fog"
            }`}
            onClick={() => setFilter("unassigned")}
          >
            Unassigned ({unassignedIds.length})
          </button>
        </div>
      </header>
      <ul className="min-h-0 flex-1 overflow-auto p-2">
        {visible.map((photo) => (
          <li key={photo.id} className="mb-2">
            <article
              draggable
              onDragStart={(event) => {
                const payload: DragPayload = {
                  photoId: photo.id,
                  fromCollectionId: null,
                };
                event.dataTransfer.setData(
                  "application/x-fatni-photo",
                  JSON.stringify(payload),
                );
                event.dataTransfer.effectAllowed = "copyMove";
                onDragStart(payload);
              }}
              className={`flex gap-2 border p-2 ${
                selectedId === photo.id ? "border-ember" : "border-line"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(photo.id)}
                className="h-16 w-16 shrink-0 overflow-hidden bg-ink"
              >
                <CuratorThumb photo={photo} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base italic text-paper">
                  {photo.title}
                </p>
                {unassigned.has(photo.id) ? (
                  <p className="font-brand text-[11px] tracking-[0.08em] text-ember">
                    Unassigned
                  </p>
                ) : null}
                <label className="mt-1 block font-brand text-[11px] text-fog">
                  Add to
                  <select
                    className="ml-2 max-w-full bg-ink text-paper"
                    defaultValue=""
                    onChange={(event) => {
                      const value = event.target.value;
                      event.target.value = "";
                      if (value) onAddToCollection(photo.id, value);
                    }}
                  >
                    <option value="">collection…</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.siteId === "fatni-photography"
                          ? "Fatni"
                          : "Ayoub"}{" "}
                        / {collection.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
