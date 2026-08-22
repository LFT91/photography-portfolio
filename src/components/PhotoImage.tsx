import type { CSSProperties } from "react";
import { gridSrcSet, variantsFor, type ImageVariant } from "@/lib/image";

type PhotoImageProps = {
  src: string;
  alt: string;
  variant?: "tile" | "display" | "hero";
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  fill?: boolean;
};

function pickVariant(
  src: string,
  variant: PhotoImageProps["variant"],
): ImageVariant {
  const variants = variantsFor(src);
  if (variant === "hero") return variants.hero ?? variants.display;
  if (variant === "display") return variants.display;
  return variants.tile;
}

export function PhotoImage({
  src,
  alt,
  variant = "tile",
  sizes,
  priority = false,
  className = "",
  style,
  fill = false,
}: PhotoImageProps) {
  const chosen = pickVariant(src, variant);
  const srcSet =
    variant === "tile" && !src.startsWith("blob:") && !src.startsWith("data:")
      ? gridSrcSet(src)
      : undefined;

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
    // eslint-disable-next-line @next/next/no-img-element -- derivatives are pre-sized; do not use Vercel optimizer
    <img
      src={chosen.src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={fill ? undefined : chosen.width}
      height={fill ? undefined : chosen.height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      draggable={false}
      className={`protect-media ${className}`}
      style={mergedStyle}
    />
  );
}
