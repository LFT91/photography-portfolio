import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyExactSwaps,
  indicesForKeys,
  resolveMultiSwapDest,
} from "../gallery-reorder";

describe("resolveMultiSwapDest", () => {
  it("single drop swaps with the drop index", () => {
    assert.deepEqual(resolveMultiSwapDest(5, [1], 3), [3]);
    assert.equal(resolveMultiSwapDest(5, [1], 1), null);
  });

  it("row-sized block prefers starting at the drop target", () => {
    // sources 0,1,2 → drop on 6 → dest 6,7,8
    assert.deepEqual(resolveMultiSwapDest(9, [0, 1, 2], 6), [6, 7, 8]);
  });

  it("two-from-row swaps with two starting at drop", () => {
    assert.deepEqual(resolveMultiSwapDest(9, [3, 4], 7), [7, 8]);
  });

  it("avoids overlapping destination by ending at drop when needed", () => {
    // sources 4,5,6; drop 5 would start-at-drop overlap — end-at-drop → 3,4,5 still overlaps
    // drop 7 with sources 4,5,6 → dest 7,8,? need length 9 → 7,8 and need 3 slots
    assert.deepEqual(resolveMultiSwapDest(9, [4, 5, 6], 7), null);
    assert.deepEqual(resolveMultiSwapDest(9, [0, 1, 2], 3), [3, 4, 5]);
  });
});

describe("applyExactSwaps", () => {
  it("swaps two singles exactly", () => {
    assert.deepEqual(applyExactSwaps(["a", "b", "c"], [0], [2]), [
      "c",
      "b",
      "a",
    ]);
  });

  it("swaps a contiguous pair without moving the rest", () => {
    const next = applyExactSwaps(
      ["a", "b", "c", "d", "e", "f"],
      [0, 1],
      [3, 4],
    );
    assert.deepEqual(next, ["d", "e", "c", "a", "b", "f"]);
  });

  it("swaps a full row block", () => {
    const next = applyExactSwaps(
      ["a", "b", "c", "d", "e", "f"],
      [0, 1, 2],
      [3, 4, 5],
    );
    assert.deepEqual(next, ["d", "e", "f", "a", "b", "c"]);
  });

  it("refuses overlapping ranges", () => {
    assert.equal(applyExactSwaps(["a", "b", "c"], [0, 1], [1, 2]), null);
  });
});

describe("indicesForKeys", () => {
  it("maps keys to sorted indices", () => {
    const map = new Map([
      ["x", 2],
      ["y", 0],
      ["z", 5],
    ]);
    assert.deepEqual(indicesForKeys(["z", "y"], map), [0, 5]);
  });
});
