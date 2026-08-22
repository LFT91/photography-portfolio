"use client";

import { variantsFor } from "@/lib/image";
import type { CuratorPhoto } from "@/lib/admin/types";

export function CuratorThumb({
  photo,
  className = "",
  variant = "tile",
  fit = "cover",
}: {
  photo: CuratorPhoto;
  className?: string;
  variant?: "tile" | "large" | "display";
  fit?: "cover" | "contain";
}) {
  const variants = variantsFor(photo.src);
  const src =
    variant === "display"
      ? variants.display.src
      : variant === "large"
        ? (variants.large?.src ?? variants.tile.src)
        : variants.tile.src;
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local curator thumbs use pre-generated tiles
    <img
      src={src}
      alt={photo.title}
      className={`pointer-events-none h-full w-full ${fitClass} ${className}`}
      draggable={false}
    />
  );
}
