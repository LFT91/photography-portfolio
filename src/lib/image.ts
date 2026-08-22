import manifest from "@/data/image-manifest.json";

export const SMALL_WIDTH = 480;
export const TILE_WIDTH = 800;
export const LARGE_WIDTH = 1200;
export const DISPLAY_WIDTH = 1800;
export const HERO_WIDTH = 1600;

export type ImageVariant = {
  src: string;
  width?: number;
  height?: number;
  version?: string;
};

export type ImageVariants = {
  small?: ImageVariant;
  tile: ImageVariant;
  large?: ImageVariant;
  display: ImageVariant;
  hero?: ImageVariant;
};

type ManifestVariant = {
  src: string;
  width: number;
  height: number;
  version?: string;
};

type ManifestEntry = {
  width: number;
  height: number;
  small?: ManifestVariant;
  tile: ManifestVariant;
  large?: ManifestVariant;
  display: ManifestVariant;
  hero?: ManifestVariant;
};

const IMAGE_MANIFEST = manifest as Record<string, ManifestEntry>;

export function localImagePath(src: string): string | null {
  if (!src) return null;
  if (src.startsWith("/images/")) return src.split("?")[0];
  return null;
}

export function versionedSrc(src: string, version?: string): string {
  const path = src.split("?")[0];
  if (!version) return path;
  return `${path}?v=${version}`;
}

function renderVariant(variant: ManifestVariant | ImageVariant): ImageVariant {
  return {
    src: versionedSrc(variant.src, variant.version),
    width: variant.width,
    height: variant.height,
    version: variant.version,
  };
}

function manifestEntry(src: string): ManifestEntry | null {
  const local = localImagePath(src);
  if (!local) return null;
  return IMAGE_MANIFEST[local] ?? null;
}

export function variantsFor(src: string): ImageVariants {
  if (src.startsWith("blob:") || src.startsWith("data:")) {
    return { tile: { src }, display: { src } };
  }

  const entry = manifestEntry(src);
  if (entry) {
    return {
      small: entry.small ? renderVariant(entry.small) : undefined,
      tile: renderVariant(entry.tile),
      large: entry.large ? renderVariant(entry.large) : undefined,
      display: renderVariant(entry.display),
      hero: entry.hero ? renderVariant(entry.hero) : undefined,
    };
  }

  return { tile: { src }, display: { src } };
}

/** Gallery tiles: 480 / 800 / 1200 only. Never include the 1800 lightbox file. */
export function gridSrcSet(src: string): string | undefined {
  const variants = variantsFor(src);
  const parts: string[] = [];
  if (variants.small?.src) {
    parts.push(`${variants.small.src} ${variants.small.width ?? SMALL_WIDTH}w`);
  }
  parts.push(`${variants.tile.src} ${variants.tile.width ?? TILE_WIDTH}w`);
  if (variants.large?.src) {
    parts.push(`${variants.large.src} ${variants.large.width ?? LARGE_WIDTH}w`);
  }
  return parts.length ? parts.join(", ") : undefined;
}

export function heroImage(): ImageVariant {
  const entry = IMAGE_MANIFEST["/images/after-dark/startrails.jpg"];
  if (entry?.hero) return renderVariant(entry.hero);
  return variantsFor("/images/after-dark/startrails.jpg").display;
}

export function absoluteImageUrl(src: string, origin: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${origin.replace(/\/$/, "")}${src.startsWith("/") ? src : `/${src}`}`;
}
