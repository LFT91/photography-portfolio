/**
 * Deterministic collection_photos order persistence helpers.
 * Visual index i must become sort_order i (contiguous 0..N-1).
 */

export type PlannedMembershipOrder = {
  photo_id: string;
  sort_order: number;
};

/** Map the exact in-memory visual sequence to contiguous sort_order values. */
export function planContiguousCollectionOrder(
  photoIds: readonly string[],
): PlannedMembershipOrder[] {
  return photoIds.map((photo_id, sort_order) => ({ photo_id, sort_order }));
}

export function isContiguousSortOrders(
  orders: readonly number[],
): boolean {
  if (orders.length === 0) return true;
  const sorted = [...orders].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i) return false;
  }
  return true;
}

export function hasDuplicateSortOrders(orders: readonly number[]): boolean {
  return new Set(orders).size !== orders.length;
}

export function sequencesMatch(
  expected: readonly string[],
  actual: readonly string[],
): boolean {
  if (expected.length !== actual.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== actual[i]) return false;
  }
  return true;
}

/**
 * Legacy remapping used existing sort_order values sorted ascending.
 * That can diverge from the visible sequence when ranks are gapped/duplicated
 * or when only a subset of memberships is updated. Kept for regression tests.
 */
export function legacyRemapExistingRanks(
  visualPhotoIds: readonly string[],
  currentById: ReadonlyMap<string, number>,
): PlannedMembershipOrder[] | null {
  const ranks = visualPhotoIds
    .map((id) => currentById.get(id))
    .filter((n): n is number => n != null)
    .sort((a, b) => a - b);
  if (ranks.length !== visualPhotoIds.length) return null;
  return visualPhotoIds.map((photo_id, i) => ({
    photo_id,
    sort_order: ranks[i],
  }));
}

export type OrderPersistVerification =
  | { ok: true }
  | { ok: false; detail: string };

export function verifyPersistedPhotoOrder(input: {
  submittedPhotoIds: readonly string[];
  persistedPhotoIdsInOrder: readonly string[];
  collectionLabel: string;
}): OrderPersistVerification {
  if (
    !sequencesMatch(input.submittedPhotoIds, input.persistedPhotoIdsInOrder)
  ) {
    return {
      ok: false,
      detail: `Order verification failed for “${input.collectionLabel}”: saved sequence does not match the pre-save visual order.`,
    };
  }
  return { ok: true };
}
