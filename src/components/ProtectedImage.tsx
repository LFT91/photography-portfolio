"use client";

import Image, { type ImageProps } from "next/image";

/** Softens casual save/drag; does not stop determined scraping. */
export function ProtectedImage({
  className = "",
  onContextMenu,
  onDragStart,
  ...props
}: ImageProps) {
  return (
    <Image
      {...props}
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
