"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ProtectedImage } from "@/components/ProtectedImage";
import { photoInCategory, type Photo, type PhotoCategory } from "@/data/photos";
import { photoOrderInCategory } from "@/lib/catalog";

function Lightbox({
  items,
  index,
  onClose,
  onChange,
  discreet = false,
}: {
  items: Photo[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
  discreet?: boolean;
}) {
  const photo = items[index];
  const total = items.length;
  const touchStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);

  const go = (delta: number) => {
    if (total < 2) return;
    onChange((index + delta + total) % total);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (total < 2) return;
      if (e.key === "ArrowLeft") onChange((index - 1 + total) % total);
      if (e.key === "ArrowRight") onChange((index + 1) % total);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, total, onClose, onChange]);

  if (!photo) return null;

  return (
    <div
      className="animate-fade fixed inset-0 z-[80] flex flex-col bg-ink/95 backdrop-blur-sm"
      onClick={() => {
        if (didSwipe.current) {
          didSwipe.current = false;
          return;
        }
        onClose();
      }}
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={(e) => {
        touchStartX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start == null) return;
        const end = e.changedTouches[0]?.clientX;
        if (end == null) return;
        const delta = end - start;
        if (Math.abs(delta) < 56) return;
        didSwipe.current = true;
        go(delta > 0 ? -1 : 1);
      }}
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
    >
      <div
        className="flex items-center justify-between px-5 pt-5 sm:px-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-brand text-sm tracking-[0.14em] text-fog tabular-nums">
          {String(index + 1).padStart(2, "0")}
          <span className="mx-2 text-line">—</span>
          {String(total).padStart(2, "0")}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="font-brand text-sm tracking-[0.08em] text-paper-dim transition-colors hover:text-paper"
        >
          Close
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-16 sm:pb-8">
        {total > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous photograph"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="lightbox-nav absolute top-1/2 left-2 z-10 -translate-y-1/2 font-brand text-3xl text-paper-dim transition-colors hover:text-paper sm:left-5 sm:text-4xl"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next photograph"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="lightbox-nav absolute top-1/2 right-2 z-10 -translate-y-1/2 font-brand text-3xl text-paper-dim transition-colors hover:text-paper sm:right-5 sm:text-4xl"
            >
              ›
            </button>
          </>
        ) : null}

        <div className="pointer-events-none flex w-full max-w-6xl flex-col">
          <div
            key={photo.src}
            className={`lightbox-frame relative mx-auto w-full ${
              discreet ? "h-[74svh] sm:h-[80svh]" : "h-[68svh] sm:h-[72svh]"
            }`}
          >
            <ProtectedImage
              src={photo.src}
              alt={photo.title}
              fill
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="pointer-events-none object-contain"
              priority
            />
          </div>

          {discreet ? (
            <p className="mt-4 px-1 text-center font-brand text-xs tracking-[0.14em] text-fog/70">
              {photo.title}
            </p>
          ) : (
            <div className="mt-5 flex items-baseline justify-between gap-4 px-1">
              <h3 className="font-display text-2xl italic text-paper sm:text-3xl">
                {photo.title}
              </h3>
              <p className="shrink-0 font-brand text-sm tracking-[0.08em] text-fog">
                {photo.categories.join(" · ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SCALE_MIN = 0.45;
const SCALE_LAYOUT_MAX = 3;

function clampScale(n: number, max = SCALE_LAYOUT_MAX) {
  return Math.round(Math.min(max, Math.max(SCALE_MIN, n)) * 100) / 100;
}

function spanForScale(scale: number, cols: number) {
  if (cols <= 1 || scale <= 1) return 1;
  if (scale <= 2) return Math.min(2, cols);
  return cols;
}

function widthPctForScale(scale: number, span: number) {
  return Math.round((scale / span) * 1000) / 10;
}

function useGalleryLayout(mode: "fatni" | "ayoub" = "fatni") {
  const [cols, setCols] = useState<1 | 2 | 3>(mode === "ayoub" ? 2 : 3);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCols = () => {
      if (mode === "ayoub") {
        setCols(window.matchMedia("(min-width: 768px)").matches ? 2 : 1);
        return;
      }
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setCols(3);
      } else if (window.matchMedia("(min-width: 768px)").matches) {
        setCols(2);
      } else {
        setCols(1);
      }
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, [mode]);

  return { cols, galleryRef };
}

function GalleryCard({
  photo,
  index,
  onOpen,
  cols,
  uniformColumn = false,
}: {
  photo: Photo;
  index: number;
  onOpen: (photo: Photo) => void;
  cols: number;
  uniformColumn?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const savedScale = clampScale(photo.displayScale ?? 1);
  const layoutScale = uniformColumn ? 1 : Math.min(savedScale, Math.min(SCALE_LAYOUT_MAX, cols));
  const span = uniformColumn ? 1 : spanForScale(layoutScale, cols);
  const imageWidthPct = uniformColumn ? 100 : widthPctForScale(layoutScale, span);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("is-visible");

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add("is-visible");
        observer.unobserve(el);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [photo.id, photo.src]);

  return (
    <div
      ref={ref}
      className="gallery-item group relative w-full min-w-0"
      style={{
        transitionDelay: `${(index % 6) * 25}ms`,
        gridColumn: `span ${span} / span ${span}`,
      }}
    >
      <div className="w-full">
        <div
          className={`relative mx-auto ${uniformColumn ? "bg-ink" : "bg-ink-soft"}`}
          style={{ width: `${imageWidthPct}%` }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            className={`relative w-full min-w-0 overflow-hidden ${
              uniformColumn ? "flex justify-center" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => onOpen(photo)}
              onContextMenu={(e) => e.preventDefault()}
              className={`overflow-hidden text-left ${
                uniformColumn
                  ? "relative mx-auto block max-w-full"
                  : "relative block w-full min-w-0"
              }`}
            >
              <ProtectedImage
                src={photo.src}
                alt={photo.title}
                width={800}
                height={600}
                sizes={
                  uniformColumn
                    ? "(max-width: 768px) 100vw, 580px"
                    : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                }
                className={
                  uniformColumn
                    ? "mx-auto h-auto max-h-[70svh] w-auto max-w-full object-contain"
                    : "h-auto w-full max-h-[85svh] object-contain md:max-h-none"
                }
                style={
                  uniformColumn
                    ? {
                        width: "auto",
                        height: "auto",
                        maxHeight: "70svh",
                        maxWidth: "100%",
                      }
                    : { width: "100%", height: "auto" }
                }
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-5 opacity-100 transition-opacity duration-500 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                <p className="font-display text-xl italic text-paper">
                  {photo.title}
                </p>
                {!uniformColumn ? (
                  <p className="mt-1 font-brand text-sm tracking-[0.08em] text-paper-dim">
                    {photo.categories.join(" · ")}
                  </p>
                ) : null}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Gallery({
  title = "Gallery",
  intro,
  lockedCategory,
  showFilters = true,
  tightTop = false,
  compactTop = false,
  sectionId,
  items,
  presentation = "default",
}: {
  title?: string;
  intro?: string;
  lockedCategory?: PhotoCategory;
  showFilters?: boolean;
  tightTop?: boolean;
  compactTop?: boolean;
  sectionId?: string;
  items?: Photo[];
  presentation?: "default" | "ayoub";
}) {
  const ayoub = presentation === "ayoub";
  const { cols, galleryRef } = useGalleryLayout(ayoub ? "ayoub" : "fatni");
  const source = items ?? [];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const room = lockedCategory ?? "Nature";

  const filtered = source
    .filter((photo) => photoInCategory(photo, room))
    .slice()
    .sort(
      (a, b) => photoOrderInCategory(a, room) - photoOrderInCategory(b, room),
    );

  const showHeader = Boolean(title) || (showFilters && !lockedCategory);

  return (
    <section
      id={sectionId}
      className={`relative bg-ink px-5 pb-16 sm:px-8 sm:pb-24 ${
        sectionId ? "scroll-mt-16 sm:scroll-mt-20" : ""
      } ${
        compactTop
          ? "pt-1 sm:pt-2"
          : tightTop
            ? "pt-6 sm:pt-8"
            : "pt-10 sm:pt-14"
      }`}
    >
      <div className={`mx-auto ${ayoub ? "max-w-[1160px]" : "max-w-7xl"}`}>
        {showHeader ? (
          <div
            className={`mb-14 flex flex-col gap-6 ${
              showFilters && !lockedCategory
                ? "md:flex-row md:items-end md:justify-between"
                : ""
            }`}
          >
            {title ? (
              <div>
                <h1 className="font-display text-4xl italic text-paper sm:text-5xl">
                  {title}
                </h1>
                {intro ? (
                  <p className="mt-4 max-w-lg font-brand text-base text-paper-dim sm:text-lg">
                    {intro}
                  </p>
                ) : null}
              </div>
            ) : (
              <div />
            )}
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <p className="font-brand text-paper-dim">
            No photos in this section yet.
          </p>
        ) : (
          <div
            ref={galleryRef}
            className={
              ayoub
                ? "grid grid-cols-1 grid-flow-dense items-start gap-6 md:grid-cols-2 md:gap-6"
                : "grid grid-cols-1 grid-flow-dense items-start gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3"
            }
          >
            {filtered.map((photo, index) => (
              <GalleryCard
                key={photo.id}
                photo={photo}
                index={index}
                onOpen={(item) => {
                  const i = filtered.findIndex((p) => p.id === item.id);
                  if (i >= 0) setActiveIndex(i);
                }}
                cols={cols}
                uniformColumn={ayoub}
              />
            ))}
          </div>
        )}
      </div>

      {activeIndex != null ? (
        <Lightbox
          items={filtered}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onChange={setActiveIndex}
          discreet={ayoub}
        />
      ) : null}
    </section>
  );
}
