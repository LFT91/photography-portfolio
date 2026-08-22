import { existsSync } from "node:fs";
import { resolve } from "node:path";

export const IMAGE_DERIVATIVE_WIDTHS = [480, 800, 1200, 1800] as const;
export type ImageDerivativeWidth = (typeof IMAGE_DERIVATIVE_WIDTHS)[number];

export type ImageManifestEntry = {
  src: string;
  width?: number;
  height?: number;
  derivatives?: Partial<Record<`${ImageDerivativeWidth}`, string>>;
};

export type ImageManifest = {
  version: 1;
  widths: readonly ImageDerivativeWidth[];
  photos: Record<string, ImageManifestEntry>;
};

export const IMAGE_MANIFEST_RELATIVE = "src/data/image-manifest.json";

export function publicPathToFs(src: string, projectRoot = process.cwd()): string {
  const relative = src.replace(/^\//, "");
  return resolve(projectRoot, "public", relative);
}

export function publicFileExists(src: string, projectRoot = process.cwd()): boolean {
  if (!src.startsWith("/")) return false;
  return existsSync(publicPathToFs(src, projectRoot));
}

export function derivativePublicPath(
  photoId: string,
  width: ImageDerivativeWidth,
): string {
  return `/images/generated/${photoId}/${width}.jpg`;
}
