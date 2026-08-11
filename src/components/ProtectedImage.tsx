"use client";

import type { CSSProperties, ImgHTMLAttributes } from "react";
import { resolvePhotoUrl } from "@/lib/photo-url";

/**
 * Photograph <img> that never routes through `/_next/image`.
 * Vercel Hobby Image Optimization returns 402 once the transform quota is
 * exhausted; cached URLs keep working and new ones break — which looked like
 * “only moved photos fail.” Serve already-web-sized assets directly.
 */
type ProtectedImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "width" | "height" | "alt"
> & {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** Mimic next/image `fill` — parent must be `position: relative`. */
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  /** Accepted for call-site compatibility; always ignored. */
  unoptimized?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
};

export function ProtectedImage({
  className = "",
  onContextMenu,
  onDragStart,
  src,
  alt,
  fill,
  width,
  height,
  sizes: _sizes,
  priority,
  unoptimized: _unoptimized,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blur,
  style,
  ...props
}: ProtectedImageProps) {
  const resolved = resolvePhotoUrl(src);
  const mergedStyle: CSSProperties | undefined = fill
    ? {
        position: "absolute",
        height: "100%",
        width: "100%",
        inset: 0,
        ...style,
      }
    : style;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- intentional: bypass Vercel optimizer
    <img
      {...props}
      src={resolved}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      draggable={false}
      className={`protect-media ${className}`}
      style={mergedStyle}
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
