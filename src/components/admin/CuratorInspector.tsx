"use client";

import type { CuratorCollection, CuratorPhoto } from "@/lib/admin/types";
import { CuratorThumb } from "@/components/admin/CuratorThumb";
import { collectionOptionLabel } from "@/components/admin/photo-drag";

export function CuratorInspector({
  photo,
  collections,
  currentCollectionId,
  onTitle,
  onDisplayScale,
  onAdd,
  onMove,
  onRemoveFrom,
}: {
  photo: CuratorPhoto | null;
  collections: CuratorCollection[];
  currentCollectionId: string | null;
  onTitle: (value: string) => void;
  onDisplayScale: (value: number) => void;
  onAdd: (collectionId: string) => void;
  onMove: (collectionId: string) => void;
  onRemoveFrom: (collectionId: string) => void;
}) {
  const memberships = photo
    ? collections.filter((item) => item.photoIds.includes(photo.id))
    : [];
  const addTargets = photo
    ? collections.filter((item) => !item.photoIds.includes(photo.id))
    : [];
  const moveTargets = currentCollectionId
    ? collections.filter((item) => item.id !== currentCollectionId)
    : [];
  const inCurrent =
    Boolean(photo) &&
    Boolean(currentCollectionId) &&
    memberships.some((item) => item.id === currentCollectionId);

  return (
    <aside className="curator-inspector">
      <h2>Photograph</h2>
      {photo ? (
        <div>
          <div className="curator-preview">
            <CuratorThumb photo={photo} variant="large" fit="contain" />
          </div>
          <label className="curator-field">
            <span>Title</span>
            <input
              type="text"
              value={photo.title}
              onChange={(event) => onTitle(event.target.value)}
            />
          </label>
          <label className="curator-field">
            <span>displayScale</span>
            <input
              type="number"
              min={0.45}
              max={3}
              step={0.01}
              value={photo.displayScale ?? 1}
              onChange={(event) => {
                const value = Number.parseFloat(event.target.value);
                onDisplayScale(Number.isFinite(value) ? value : 1);
              }}
            />
          </label>
          <div className="curator-field">
            <span>Memberships</span>
            {memberships.length ? (
              <ul className="curator-chips">
                {memberships.map((item) => (
                  <li key={item.id} className="curator-chip">
                    {collectionOptionLabel(item.site, item.title)}
                    <button
                      type="button"
                      aria-label={`Remove from ${item.title}`}
                      onClick={() => onRemoveFrom(item.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="curator-hint">Unassigned</p>
            )}
          </div>
          <div className="curator-inspector-actions">
            <label className="curator-field">
              <span>Add to collection</span>
              <select
                value=""
                disabled={addTargets.length === 0}
                onChange={(event) => {
                  const value = event.target.value;
                  event.target.value = "";
                  if (value) onAdd(value);
                }}
              >
                <option value="">Choose collection…</option>
                {addTargets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {collectionOptionLabel(item.site, item.title)}
                  </option>
                ))}
              </select>
            </label>
            {currentCollectionId && inCurrent ? (
              <label className="curator-field">
                <span>Move to collection</span>
                <select
                  value=""
                  onChange={(event) => {
                    const value = event.target.value;
                    event.target.value = "";
                    if (value) onMove(value);
                  }}
                >
                  <option value="">Choose collection…</option>
                  {moveTargets.map((item) => (
                    <option key={item.id} value={item.id}>
                      {collectionOptionLabel(item.site, item.title)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {currentCollectionId && inCurrent ? (
              <button
                type="button"
                className="curator-btn curator-btn-danger"
                onClick={() => onRemoveFrom(currentCollectionId)}
              >
                Remove from current collection
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="curator-hint">Select a photograph to inspect it.</p>
      )}
    </aside>
  );
}
