import type {
  CatalogDraft,
  CuratorCollection,
  CuratorPhoto,
} from "@/lib/admin/types";

export function cloneDraft(draft: CatalogDraft): CatalogDraft {
  return {
    photos: draft.photos.map((photo) => ({ ...photo })),
    collections: draft.collections.map((collection) => ({
      ...collection,
      photoIds: [...collection.photoIds],
    })),
  };
}

export function draftSnapshot(draft: CatalogDraft): string {
  return JSON.stringify({
    photos: draft.photos.map((photo) => ({
      id: photo.id,
      title: photo.title,
      src: photo.src,
      displayScale: photo.displayScale ?? 1,
    })),
    collections: draft.collections.map((collection) => ({
      id: collection.id,
      photoIds: collection.photoIds,
    })),
  });
}

export function moveIndex<T>(list: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= list.length ||
    to >= list.length
  ) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (item === undefined) return list;
  next.splice(to, 0, item);
  return next;
}

function withCollection(
  collections: CuratorCollection[],
  collectionId: string,
  update: (photoIds: string[]) => string[],
): CuratorCollection[] {
  return collections.map((collection) => {
    if (collection.id !== collectionId) return collection;
    return { ...collection, photoIds: update([...collection.photoIds]) };
  });
}

export function reorderInCollection(
  collections: CuratorCollection[],
  collectionId: string,
  from: number,
  to: number,
): CuratorCollection[] {
  return withCollection(collections, collectionId, (ids) =>
    moveIndex(ids, from, to),
  );
}

export function removeFromCollection(
  collections: CuratorCollection[],
  collectionId: string,
  photoId: string,
): CuratorCollection[] {
  return withCollection(collections, collectionId, (ids) =>
    ids.filter((id) => id !== photoId),
  );
}

export function addToCollection(
  collections: CuratorCollection[],
  collectionId: string,
  photoId: string,
  index?: number,
): CuratorCollection[] {
  return withCollection(collections, collectionId, (ids) => {
    if (ids.includes(photoId)) return ids;
    const next = [...ids];
    const at =
      index == null ? next.length : Math.max(0, Math.min(index, next.length));
    next.splice(at, 0, photoId);
    return next;
  });
}

export function moveToCollection(
  collections: CuratorCollection[],
  photoId: string,
  fromCollectionId: string,
  toCollectionId: string,
  index?: number,
): CuratorCollection[] {
  if (fromCollectionId === toCollectionId) {
    const from = collections.find((item) => item.id === fromCollectionId);
    const fromIndex = from?.photoIds.indexOf(photoId) ?? -1;
    if (fromIndex < 0) return collections;
    const dest = index ?? fromIndex;
    return reorderInCollection(collections, fromCollectionId, fromIndex, dest);
  }
  const removed = removeFromCollection(collections, fromCollectionId, photoId);
  return addToCollection(removed, toCollectionId, photoId, index);
}

export function updatePhoto(
  photos: CuratorPhoto[],
  photoId: string,
  patch: Partial<Pick<CuratorPhoto, "title" | "displayScale">>,
): CuratorPhoto[] {
  return photos.map((photo) => {
    if (photo.id !== photoId) return photo;
    const next = { ...photo, ...patch };
    if (next.displayScale === 1) delete next.displayScale;
    return next;
  });
}

export function unassignedIds(
  photos: readonly CuratorPhoto[],
  collections: readonly CuratorCollection[],
): string[] {
  const assigned = new Set<string>();
  for (const collection of collections) {
    for (const id of collection.photoIds) assigned.add(id);
  }
  return photos
    .filter((photo) => !assigned.has(photo.id))
    .map((photo) => photo.id);
}
