"use client";

import { variantsFor } from "@/lib/image";
import type { CuratorPhoto } from "@/lib/admin/types";

export function CuratorThumb({
  photo,
  className = "",
}: {
  photo: CuratorPhoto;
  className?: string;
}) {
  const src = variantsFor(photo.src).tile.src;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local curator thumbs use pre-generated tiles
    <img
      src={src}
      alt={photo.title}
      className={`pointer-events-none h-full w-full object-cover ${className}`}
      draggable={false}
    />
  );
}
