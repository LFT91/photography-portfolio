const SLUG_MAX = 80;

export function slugifyPhotoId(input: string): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX);
  return slug || "photograph";
}

export function allocatePhotoId(
  seed: string,
  existingIds: ReadonlySet<string>,
): string {
  const base = slugifyPhotoId(seed);
  if (!existingIds.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!existingIds.has(candidate)) return candidate;
  }
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}
