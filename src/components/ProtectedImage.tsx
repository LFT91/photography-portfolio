"use client";

import Image, { type ImageProps } from "next/image";

/** Softens casual save/drag; does not stop determined scraping. */
export function ProtectedImage({
  className = "",
  onContextMenu,
  onDragStart,
  src,
  unoptimized,
  ...props
}: ImageProps) {
  const raw = typeof src === "string" ? src : "";
  const localPreview = raw.startsWith("blob:") || raw.startsWith("data:");

  return (
    <Image
      {...props}
      src={src}
      unoptimized={localPreview || unoptimized}
      draggable={false}
      className={`protect-media ${className}`}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e);
      }}
      onDragStart={(e) => {
        e.preventDefault();
        onDragStart?.(e);
      }}
    />
  );
}
