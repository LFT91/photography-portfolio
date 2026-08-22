"use client";

import type { CuratorCollection, CuratorPhoto } from "@/lib/admin/types";
import { CuratorThumb } from "@/components/admin/CuratorThumb";

type DragPayload = {
  photoId: string;
  fromCollectionId: string | null;
};

export function CollectionBoard({
  collection,
  photosById,
  collections,
  onReorder,
  onDropPhoto,
  onRemove,
  onMove,
  onAdd,
}: {
  collection: CuratorCollection;
  photosById: Map<string, CuratorPhoto>;
  collections: CuratorCollection[];
  onReorder: (from: number, to: number) => void;
  onDropPhoto: (payload: DragPayload, index: number, add: boolean) => void;
  onRemove: (photoId: string) => void;
  onMove: (photoId: string, toCollectionId: string) => void;
  onAdd: (photoId: string, toCollectionId: string) => void;
}) {
  const siteLabel =
    collection.site === "fatni" ? "Fatni Photography" : "Ayoub El Fatni";

  return (
    <section
      className="flex min-h-[28rem] min-w-[18rem] flex-1 flex-col border border-line bg-ink-soft/30"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = event.altKey ? "copy" : "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData("application/x-fatni-photo");
        if (!raw) return;
        const payload = JSON.parse(raw) as DragPayload;
        onDropPhoto(payload, collection.photoIds.length, event.altKey);
      }}
    >
      <header className="border-b border-line px-3 py-2">
        <p className="font-brand text-[11px] tracking-[0.12em] text-fog uppercase">
          {siteLabel}
        </p>
        <h2 className="font-display text-xl italic text-paper">
          {collection.title}
        </h2>
        <p className="font-brand text-xs text-fog">
          {collection.photoIds.length}{" "}
          {collection.photoIds.length === 1 ? "photograph" : "photographs"}
        </p>
      </header>
      <ol className="min-h-0 flex-1 overflow-auto p-2">
        {collection.photoIds.map((photoId, index) => {
          const photo = photosById.get(photoId);
          if (!photo) return null;
          return (
            <li
              key={`${collection.id}-${photoId}-${index}`}
              className="mb-2"
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const raw = event.dataTransfer.getData(
                  "application/x-fatni-photo",
                );
                if (!raw) return;
                const payload = JSON.parse(raw) as DragPayload;
                onDropPhoto(payload, index, event.altKey);
              }}
            >
              <article
                draggable
                onDragStart={(event) => {
                  const payload: DragPayload = {
                    photoId,
                    fromCollectionId: collection.id,
                  };
                  event.dataTransfer.setData(
                    "application/x-fatni-photo",
                    JSON.stringify(payload),
                  );
                  event.dataTransfer.effectAllowed = "copyMove";
                }}
                className="border border-line bg-ink p-2"
              >
                <div className="flex gap-2">
                  <div className="h-16 w-16 shrink-0 overflow-hidden">
                    <CuratorThumb photo={photo} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base italic text-paper">
                      {photo.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="border border-line px-1.5 py-0.5 font-brand text-[11px] text-paper disabled:opacity-30"
                        disabled={index === 0}
                        onClick={() => onReorder(index, index - 1)}
                      >
                        Move up
                      </button>
                      <button
                        type="button"
                        className="border border-line px-1.5 py-0.5 font-brand text-[11px] text-paper disabled:opacity-30"
                        disabled={index === collection.photoIds.length - 1}
                        onClick={() => onReorder(index, index + 1)}
                      >
                        Move down
                      </button>
                      <button
                        type="button"
                        className="border border-line px-1.5 py-0.5 font-brand text-[11px] text-ember"
                        onClick={() => onRemove(photoId)}
                      >
                        Remove from collection
                      </button>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <label className="font-brand text-[11px] text-fog">
                        Move to
                        <select
                          className="ml-1 bg-ink text-paper"
                          defaultValue=""
                          onChange={(event) => {
                            const value = event.target.value;
                            event.target.value = "";
                            if (value) onMove(photoId, value);
                          }}
                        >
                          <option value="">collection…</option>
                          {collections
                            .filter((item) => item.id !== collection.id)
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.site === "fatni" ? "Fatni" : "Ayoub"} /{" "}
                                {item.title}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="font-brand text-[11px] text-fog">
                        Add to
                        <select
                          className="ml-1 bg-ink text-paper"
                          defaultValue=""
                          onChange={(event) => {
                            const value = event.target.value;
                            event.target.value = "";
                            if (value) onAdd(photoId, value);
                          }}
                        >
                          <option value="">collection…</option>
                          {collections
                            .filter((item) => item.id !== collection.id)
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.site === "fatni" ? "Fatni" : "Ayoub"} /{" "}
                                {item.title}
                              </option>
                            ))}
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
