"use client";

import type { CatalogPhoto } from "@/content/photos";

export function CuratorThumb({
  photo,
  className = "",
}: {
  photo: CatalogPhoto;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local curator; do not resolve to production origin
    <img
      src={photo.src}
      alt={photo.title}
      className={`pointer-events-none h-full w-full object-cover ${className}`}
      draggable={false}
    />
  );
}
