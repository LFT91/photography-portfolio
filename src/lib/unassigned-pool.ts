/**
 * Pure helpers for the admin Unassigned / Hold pool.
 * Allocation truth = collection_photos only.
 */

export type MembershipRef = {
  photo_id: string;
  collection_id: string;
  sort_order: number;
};

export function assignedPhotoIdSet(
  memberships: ReadonlyArray<{ photo_id: string }>,
): Set<string> {
  return new Set(memberships.map((m) => m.photo_id));
}

/** Photos with zero rows in collection_photos anywhere. */
export function filterUnassignedPhotos<T extends { id: string }>(
  photos: ReadonlyArray<T>,
  assignedPhotoIds: ReadonlySet<string>,
): T[] {
  return photos.filter((p) => !assignedPhotoIds.has(p.id));
}

export type UnassignedAllocationPlan =
  | { ok: true; sort_order: number }
  | {
      ok: false;
      reason: "already_assigned" | "duplicate_in_destination";
      detail: string;
    };

/**
 * Fail-closed planner for allocating a hold photo into one collection.
 * Does not mutate anything.
 */
export function planUnassignedAllocation(input: {
  photoId: string;
  destinationCollectionId: string;
  /** Live memberships across ALL collections/sites. */
  memberships: ReadonlyArray<MembershipRef>;
}): UnassignedAllocationPlan {
  const forPhoto = input.memberships.filter(
    (m) => m.photo_id === input.photoId,
  );
  if (forPhoto.length > 0) {
    return {
      ok: false,
      reason: "already_assigned",
      detail: `Photo already has ${forPhoto.length} membership(s); refuse allocate.`,
    };
  }

  const inDest = input.memberships.filter(
    (m) =>
      m.photo_id === input.photoId &&
      m.collection_id === input.destinationCollectionId,
  );
  if (inDest.length > 0) {
    return {
      ok: false,
      reason: "duplicate_in_destination",
      detail: "Photo already in destination collection.",
    };
  }

  let max = -1;
  for (const m of input.memberships) {
    if (
      m.collection_id === input.destinationCollectionId &&
      m.sort_order > max
    ) {
      max = m.sort_order;
    }
  }

  return { ok: true, sort_order: max + 1 };
}

export function applyLocalUnassignedAllocation(input: {
  photoId: string;
  destinationCollectionId: string;
  sortOrder: number;
  memberships: MembershipRef[];
  assignedPhotoIds: Set<string>;
}): { memberships: MembershipRef[]; assignedPhotoIds: Set<string> } {
  const nextMemberships = [
    ...input.memberships,
    {
      photo_id: input.photoId,
      collection_id: input.destinationCollectionId,
      sort_order: input.sortOrder,
    },
  ];
  const nextAssigned = new Set(input.assignedPhotoIds);
  nextAssigned.add(input.photoId);
  return { memberships: nextMemberships, assignedPhotoIds: nextAssigned };
}
