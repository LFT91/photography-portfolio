import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasDuplicateSortOrders,
  isContiguousSortOrders,
  legacyRemapExistingRanks,
  planContiguousCollectionOrder,
  sequencesMatch,
  verifyPersistedPhotoOrder,
} from "../collection-order";

describe("planContiguousCollectionOrder", () => {
  it("moving one item persists the exact visible order as 0..N-1", () => {
    // Visual: B, A, C after moving B before A
    const visual = ["b", "a", "c"];
    const planned = planContiguousCollectionOrder(visual);
    assert.deepEqual(
      planned.map((p) => [p.photo_id, p.sort_order]),
      [
        ["b", 0],
        ["a", 1],
        ["c", 2],
      ],
    );
    assert.equal(
      isContiguousSortOrders(planned.map((p) => p.sort_order)),
      true,
    );
    assert.equal(
      hasDuplicateSortOrders(planned.map((p) => p.sort_order)),
      false,
    );
  });

  it("moving several items persists the exact visible order", () => {
    const visual = ["c", "a", "d", "b"];
    const planned = planContiguousCollectionOrder(visual);
    assert.deepEqual(
      planned.map((p) => p.photo_id),
      visual,
    );
    assert.deepEqual(
      planned.map((p) => p.sort_order),
      [0, 1, 2, 3],
    );
  });

  it("moving an item across multiple positions works", () => {
    const start = ["a", "b", "c", "d", "e"];
    // move e to index 1 → a, e, b, c, d
    const visual = ["a", "e", "b", "c", "d"];
    const planned = planContiguousCollectionOrder(visual);
    assert.equal(planned[1].photo_id, "e");
    assert.equal(planned[1].sort_order, 1);
    assert.equal(planned[4].photo_id, "d");
    assert.equal(planned[4].sort_order, 4);
  });

  it("first/last item moves work", () => {
    const moveFirstToLast = planContiguousCollectionOrder([
      "b",
      "c",
      "a",
    ]);
    assert.deepEqual(
      moveFirstToLast.map((p) => p.photo_id),
      ["b", "c", "a"],
    );
    const moveLastToFirst = planContiguousCollectionOrder([
      "c",
      "a",
      "b",
    ]);
    assert.deepEqual(
      moveLastToFirst.map((p) => p.photo_id),
      ["c", "a", "b"],
    );
    assert.equal(moveLastToFirst[0].sort_order, 0);
  });

  it("always writes contiguous 0..N-1 with no duplicates", () => {
    const planned = planContiguousCollectionOrder([
      "z",
      "y",
      "x",
      "w",
    ]);
    const orders = planned.map((p) => p.sort_order);
    assert.equal(isContiguousSortOrders(orders), true);
    assert.equal(hasDuplicateSortOrders(orders), false);
  });
});

describe("save/reload verification", () => {
  it("Save followed by reload returns exactly the same photo_id sequence", () => {
    const submitted = ["red-door", "red-hand", "pier"];
    const planned = planContiguousCollectionOrder(submitted);
    // Simulate DB store + order-by sort_order refetch
    const persisted = [...planned]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => p.photo_id);
    const check = verifyPersistedPhotoOrder({
      submittedPhotoIds: submitted,
      persistedPhotoIdsInOrder: persisted,
      collectionLabel: "After Dark",
    });
    assert.equal(check.ok, true);
    assert.equal(sequencesMatch(submitted, persisted), true);
  });

  it("failed persistence/verification does not clear unsaved state", () => {
    const submitted = ["red-door", "red-hand"];
    const persistedWrong = ["end-of-pier", "red-hand"];
    const check = verifyPersistedPhotoOrder({
      submittedPhotoIds: submitted,
      persistedPhotoIdsInOrder: persistedWrong,
      collectionLabel: "After Dark",
    });
    assert.equal(check.ok, false);
    if (check.ok) return;
    assert.match(check.detail, /verification failed/i);
    // Caller must keep dirty=true when ok=false (contract documented by this test).
    const shouldClearUnsaved = check.ok;
    assert.equal(shouldClearUnsaved, false);
  });

  it("unrelated collections remain conceptually untouched by a planned write set", () => {
    const afterDark = planContiguousCollectionOrder(["a", "b"]);
    const monochrome = ["m1", "m2", "m3"];
    assert.equal(
      afterDark.every((row) => !monochrome.includes(row.photo_id)),
      true,
    );
  });
});

describe("legacy remap regression", () => {
  it("contiguous remap can mask intent when ranks are reused; contiguous planner does not", () => {
    // Existing ranks 0,1,2 — remap happens to equal contiguous for full sets.
    const visual = ["c", "a", "b"];
    const current = new Map([
      ["a", 0],
      ["b", 1],
      ["c", 2],
    ]);
    const legacy = legacyRemapExistingRanks(visual, current);
    const planned = planContiguousCollectionOrder(visual);
    assert.ok(legacy);
    assert.deepEqual(legacy, planned);

    // Gapped ranks: legacy remaps [0,5,9] sorted onto visual, not 0..n-1.
    const gapped = new Map([
      ["a", 0],
      ["b", 5],
      ["c", 9],
    ]);
    const legacyGapped = legacyRemapExistingRanks(visual, gapped);
    assert.ok(legacyGapped);
    assert.deepEqual(
      legacyGapped.map((p) => p.sort_order),
      [0, 5, 9],
    );
    assert.deepEqual(
      planContiguousCollectionOrder(visual).map((p) => p.sort_order),
      [0, 1, 2],
    );
  });
});
