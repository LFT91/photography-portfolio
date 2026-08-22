import type { CatalogCollection } from "@/content/collections";
import type { CatalogPhoto } from "@/content/photos";

export function cloneDraft(
  photos: readonly CatalogPhoto[],
  collections: readonly CatalogCollection[],
): { photos: CatalogPhoto[]; collections: CatalogCollection[] } {
  return {
    photos: photos.map((photo) => ({ ...photo })),
    collections: collections.map((collection) => ({
      ...collection,
      photoIds: [...collection.photoIds],
    })),
  };
}

export function draftSnapshot(
  photos: readonly CatalogPhoto[],
  collections: readonly CatalogCollection[],
): string {
  return JSON.stringify({
    photos: photos.map((photo) => ({
      id: photo.id,
      title: photo.title,
      src: photo.src,
      displayScale: photo.displayScale ?? 1,
    })),
    collections: collections.map((collection) => ({
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
  collections: CatalogCollection[],
  collectionId: string,
  update: (photoIds: string[]) => string[],
): CatalogCollection[] {
  return collections.map((collection) => {
    if (collection.id !== collectionId) return collection;
    return { ...collection, photoIds: update([...collection.photoIds]) };
  });
}

export function reorderInCollection(
  collections: CatalogCollection[],
  collectionId: string,
  from: number,
  to: number,
): CatalogCollection[] {
  return withCollection(collections, collectionId, (ids) =>
    moveIndex(ids, from, to),
  );
}

export function removeFromCollection(
  collections: CatalogCollection[],
  collectionId: string,
  photoId: string,
): CatalogCollection[] {
  return withCollection(collections, collectionId, (ids) =>
    ids.filter((id) => id !== photoId),
  );
}

export function addToCollection(
  collections: CatalogCollection[],
  collectionId: string,
  photoId: string,
  index?: number,
): CatalogCollection[] {
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
  collections: CatalogCollection[],
  photoId: string,
  fromCollectionId: string,
  toCollectionId: string,
  index?: number,
): CatalogCollection[] {
  if (fromCollectionId === toCollectionId) {
    const from = collections.find((c) => c.id === fromCollectionId);
    const fromIndex = from?.photoIds.indexOf(photoId) ?? -1;
    if (fromIndex < 0) return collections;
    const dest = index ?? fromIndex;
    return reorderInCollection(collections, fromCollectionId, fromIndex, dest);
  }
  const removed = removeFromCollection(collections, fromCollectionId, photoId);
  return addToCollection(removed, toCollectionId, photoId, index);
}

export function updatePhoto(
  photos: CatalogPhoto[],
  photoId: string,
  patch: Partial<Pick<CatalogPhoto, "title" | "displayScale">>,
): CatalogPhoto[] {
  return photos.map((photo) => {
    if (photo.id !== photoId) return photo;
    const next = { ...photo, ...patch };
    if (next.displayScale === 1) delete next.displayScale;
    return next;
  });
}

export function unassignedIds(
  photos: readonly CatalogPhoto[],
  collections: readonly CatalogCollection[],
): string[] {
  const assigned = new Set<string>();
  for (const collection of collections) {
    for (const id of collection.photoIds) assigned.add(id);
  }
  return photos.filter((photo) => !assigned.has(photo.id)).map((photo) => photo.id);
}
