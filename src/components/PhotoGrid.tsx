"use client";

import { useState } from "react";
import { Lightbox } from "@/components/Lightbox";
import { PhotoTile } from "@/components/PhotoTile";
import type { Photo } from "@/lib/photo";

export function PhotoGrid({
  items,
  title,
  intro,
  layout = "fatni",
  tightTop = false,
  compactTop = false,
  sectionId,
}: {
  items: Photo[];
  title?: string;
  intro?: string;
  layout?: "fatni" | "ayoub";
  tightTop?: boolean;
  compactTop?: boolean;
  sectionId?: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const ayoub = layout === "ayoub";

  return (
    <section
      id={sectionId}
      className={`relative bg-ink px-5 pb-16 sm:px-8 sm:pb-24 ${
        sectionId ? "scroll-mt-16 sm:scroll-mt-20" : ""
      } ${
        compactTop ? "pt-1 sm:pt-2" : tightTop ? "pt-6 sm:pt-8" : "pt-10 sm:pt-14"
      }`}
    >
      <div className={`mx-auto ${ayoub ? "max-w-[1160px]" : "max-w-7xl"}`}>
        {title ? (
          <div className="mb-14">
            <h1 className="font-display text-4xl italic text-paper sm:text-5xl">
              {title}
            </h1>
            {intro ? (
              <p className="mt-4 max-w-lg font-brand text-base text-paper-dim sm:text-lg">
                {intro}
              </p>
            ) : null}
          </div>
        ) : null}

        {items.length === 0 ? (
          <p className="font-brand text-paper-dim">
            No photos in this section yet.
          </p>
        ) : (
          <ul className="photo-grid" data-layout={layout}>
            {items.map((photo, index) => (
              <PhotoTile
                key={photo.id ?? photo.src}
                photo={photo}
                index={index}
                layout={layout}
                onOpen={setActiveIndex}
              />
            ))}
          </ul>
        )}
      </div>

      {activeIndex != null ? (
        <Lightbox
          items={items}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onChange={setActiveIndex}
          discreet={ayoub}
        />
      ) : null}
    </section>
  );
}
