/**
 * Exact multi-photo swaps for gallery edit mode.
 * Source indices swap pairwise with a same-length destination block —
 * nothing else is shifted.
 */

function rangesOverlap(
  a: readonly number[],
  b: readonly number[],
): boolean {
  const set = new Set(a);
  return b.some((i) => set.has(i));
}

function contiguousRange(start: number, length: number): number[] {
  return Array.from({ length }, (_, k) => start + k);
}

/**
 * Pick a destination index list of the same size as `sourceIndices`
 * (sorted ascending), anchored at `dropIndex`, that does not overlap sources.
 * Prefers a block starting at the drop target; falls back to a block ending there.
 */
export function resolveMultiSwapDest(
  length: number,
  sourceIndices: readonly number[],
  dropIndex: number,
): number[] | null {
  const sources = [...new Set(sourceIndices)]
    .filter((i) => i >= 0 && i < length)
    .sort((a, b) => a - b);
  const n = sources.length;
  if (n === 0) return null;
  if (dropIndex < 0 || dropIndex >= length) return null;

  if (n === 1) {
    if (sources[0] === dropIndex) return null;
    return [dropIndex];
  }

  const candidates: number[][] = [];
  const startAtDrop = Math.min(dropIndex, length - n);
  if (startAtDrop >= 0) {
    candidates.push(contiguousRange(startAtDrop, n));
  }
  const endAtDrop = dropIndex - n + 1;
  if (endAtDrop >= 0 && endAtDrop + n <= length) {
    const block = contiguousRange(endAtDrop, n);
    if (
      !candidates.some(
        (c) => c.length === block.length && c.every((v, i) => v === block[i]),
      )
    ) {
      candidates.push(block);
    }
  }

  for (const dest of candidates) {
    if (!rangesOverlap(sources, dest)) return dest;
  }
  return null;
}

/** Pairwise swap; returns null if sizes differ or ranges overlap. */
export function applyExactSwaps<T>(
  items: readonly T[],
  sourceIndices: readonly number[],
  destIndices: readonly number[],
): T[] | null {
  if (sourceIndices.length === 0) return null;
  if (sourceIndices.length !== destIndices.length) return null;
  if (rangesOverlap(sourceIndices, destIndices)) return null;

  for (const i of [...sourceIndices, ...destIndices]) {
    if (i < 0 || i >= items.length) return null;
  }

  const next = [...items];
  const srcVals = sourceIndices.map((i) => next[i]!);
  const dstVals = destIndices.map((i) => next[i]!);
  for (let k = 0; k < sourceIndices.length; k++) {
    next[sourceIndices[k]!] = dstVals[k]!;
    next[destIndices[k]!] = srcVals[k]!;
  }
  return next;
}

/** Indices in `orderedKeys` order that exist in `keyToIndex`. */
export function indicesForKeys(
  keys: readonly string[],
  keyToIndex: ReadonlyMap<string, number>,
): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const key of keys) {
    const i = keyToIndex.get(key);
    if (i == null || seen.has(i)) continue;
    seen.add(i);
    out.push(i);
  }
  return out.sort((a, b) => a - b);
}
