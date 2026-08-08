"use client";

import { useCallback, useEffect, useState } from "react";

type ArtistStagePrintProps = {
  src: string;
  alt: string;
  priority?: boolean;
  /**
   * height — prefer filling viewport height (legacy / unused by current heroes).
   * width — moderated landscape footprint (Night Train entrance).
   */
  mode?: "height" | "width";
  /** Edge dissolve into the black stage. */
  blend?: "beams" | "night";
};

type Size = { w: number; h: number };

function computeDisplaySize(
  natural: Size,
  viewport: Size,
  mode: "height" | "width",
): Size {
  if (mode === "height") {
    // Homepage façade / vertical prints — height-led, natural width.
    const maxH = viewport.h * 0.891; // ~81svh × 1.1
    const maxW = viewport.w * 0.96;
    const scale = Math.min(maxH / natural.h, maxW / natural.w);
    return {
      w: Math.round(natural.w * scale),
      h: Math.round(natural.h * scale),
    };
  }

  // Night Train: moderated cinematic landscape (~65–72vw / ≤1250px).
  const maxW = Math.min(viewport.w * 0.68, 1250);
  const maxH = viewport.h * 0.75;
  const scale = Math.min(maxW / natural.w, maxH / natural.h);
  return {
    w: Math.round(natural.w * scale),
    h: Math.round(natural.h * scale),
  };
}

/**
 * Photographic print on a black stage.
 * Aspect ratio is always preserved. Original file (no Next optimizer softener).
 */
export function ArtistStagePrint({
  src,
  alt,
  priority = false,
  mode = "height",
  blend = "beams",
}: ArtistStagePrintProps) {
  const [natural, setNatural] = useState<Size | null>(null);
  const [display, setDisplay] = useState<Size | null>(null);

  const measure = useCallback(
    (nat: Size) => {
      const viewport = {
        w: window.innerWidth,
        h: window.innerHeight,
      };
      setDisplay(computeDisplaySize(nat, viewport, mode));
    },
    [mode],
  );

  useEffect(() => {
    if (!natural) return;
    const onResize = () => measure(natural);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [natural, measure]);

  const blendStyle =
    blend === "night"
      ? {
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(11,12,14,0.28) 68%, rgba(11,12,14,0.9) 100%)",
        }
      : {
          background: [
            "linear-gradient(to right, rgba(11,12,14,0.97) 0%, transparent 11%, transparent 89%, rgba(11,12,14,0.97) 100%)",
            "linear-gradient(to bottom, rgba(11,12,14,0.55) 0%, transparent 9%, transparent 91%, rgba(11,12,14,0.75) 100%)",
            "radial-gradient(ellipse at center, transparent 50%, rgba(11,12,14,0.4) 100%)",
          ].join(", "),
        };

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={
        display
          ? { width: display.w, height: display.h }
          : { maxWidth: "96vw", maxHeight: "92svh" }
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onLoad={(e) => {
          const img = e.currentTarget;
          const nat = { w: img.naturalWidth, h: img.naturalHeight };
          if (nat.w > 0 && nat.h > 0) {
            setNatural(nat);
            measure(nat);
          }
        }}
        width={display?.w ?? undefined}
        height={display?.h ?? undefined}
        className="protect-media pointer-events-none h-full w-full select-none object-contain"
        style={
          display
            ? undefined
            : { maxWidth: "96vw", maxHeight: "92svh", width: "auto", height: "auto" }
        }
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={blendStyle}
      />
    </div>
  );
}
