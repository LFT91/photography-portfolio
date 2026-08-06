"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProtectedImage } from "@/components/ProtectedImage";
import {
  categories,
  photos,
  photoInCategory,
  type Photo,
  type PhotoCategory,
} from "@/data/photos";

function Lightbox({
  items,
  index,
  onClose,
  onChange,
}: {
  items: Photo[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
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
      className="animate-fade fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-sm"
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
      <div className="flex items-center justify-between px-5 pt-5 sm:px-8">
        <p className="font-brand text-sm tracking-[0.14em] text-fog tabular-nums">
          {String(index + 1).padStart(2, "0")}
          <span className="mx-2 text-line">—</span>
          {String(total).padStart(2, "0")}
        </p>
        <button
          type="button"
          onClick={onClose}
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

        <div
          className="flex w-full max-w-6xl flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            key={photo.src}
            className="lightbox-frame relative mx-auto h-[68svh] w-full sm:h-[72svh]"
          >
            <ProtectedImage
              src={photo.src}
              alt={photo.title}
              fill
              sizes="100vw"
              className="pointer-events-none object-contain"
              priority
            />
            <div className="absolute inset-0" aria-hidden />
          </div>

          <div className="mt-5 flex items-baseline justify-between gap-4 px-1">
            <h3 className="font-display text-2xl italic text-paper sm:text-3xl">
              {photo.title}
            </h3>
            <p className="shrink-0 font-brand text-sm tracking-[0.08em] text-fog">
              {photo.categories.join(" · ")}
            </p>
          </div>
        </div>
      </div>

      {/* Prefetch neighbours for instant stepping */}
      {total > 1 ? (
        <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden>
          <ProtectedImage
            src={items[(index + 1) % total].src}
            alt=""
            width={16}
            height={16}
          />
          <ProtectedImage
            src={items[(index - 1 + total) % total].src}
            alt=""
            width={16}
            height={16}
          />
        </div>
      ) : null}
    </div>
  );
}

function GalleryCard({
  photo,
  index,
  onOpen,
}: {
  photo: Photo;
  index: number;
  onOpen: (photo: Photo) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("is-visible");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [photo.src]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onOpen(photo)}
      onContextMenu={(e) => e.preventDefault()}
      className="gallery-item group relative mb-3 w-full break-inside-avoid overflow-hidden bg-ink-soft text-left md:mb-4"
      style={{ transitionDelay: `${(index % 6) * 60}ms` }}
    >
      <ProtectedImage
        src={photo.src}
        alt={photo.title}
        width={1600}
        height={1200}
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="h-auto w-full"
        style={{ width: "100%", height: "auto" }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
        <p className="font-display text-xl italic text-paper">{photo.title}</p>
        <p className="mt-1 font-brand text-sm tracking-[0.08em] text-paper-dim">
          {photo.categories.join(" · ")}
        </p>
      </div>
    </button>
  );
}

export function Gallery({
  title = "Gallery",
  intro,
  lockedCategory,
  showFilters = true,
  tightTop = false,
  items,
  highlightAfterDark = false,
}: {
  title?: string;
  intro?: string;
  lockedCategory?: PhotoCategory;
  showFilters?: boolean;
  tightTop?: boolean;
  items?: Photo[];
  /** Show After Dark project link on the far right in ember. */
  highlightAfterDark?: boolean;
}) {
  const source = items ?? photos;
  const [filter, setFilter] = useState<PhotoCategory>(
    lockedCategory ?? categories[0],
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const activeCategory = lockedCategory ?? filter;
    const list = source.filter((p) => photoInCategory(p, activeCategory));
    return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [filter, lockedCategory, source]);

  const selectFilter = (category: PhotoCategory) => {
    setFilter(category);
    setActiveIndex(null);
  };

  const openPhoto = (photo: Photo) => {
    const i = filtered.findIndex((p) => p.src === photo.src);
    if (i >= 0) setActiveIndex(i);
  };

  const showHeader =
    Boolean(title) || (showFilters && !lockedCategory) || highlightAfterDark;

  return (
    <section
      className={`relative bg-ink px-5 pb-16 sm:px-8 sm:pb-24 ${
        tightTop ? "pt-6 sm:pt-8" : "pt-10 sm:pt-14"
      }`}
    >
      <div className="mx-auto max-w-7xl">
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
            {showFilters && !lockedCategory ? (
              <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 md:w-auto md:justify-end">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => selectFilter(category)}
                    className={`font-brand text-sm tracking-[0.08em] transition-colors ${
                      filter === category
                        ? "text-paper"
                        : "text-fog hover:text-paper-dim"
                    }`}
                  >
                    {category}
                  </button>
                ))}
                {highlightAfterDark ? (
                  <Link
                    href="/after-dark"
                    className="font-brand ml-auto text-sm tracking-[0.08em] text-ember transition-colors hover:text-[#e0c08a] md:ml-8"
                  >
                    After Dark
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <p className="font-brand text-paper-dim">
            No photos in this section yet.
          </p>
        ) : (
          <div className="columns-1 gap-3 md:columns-2 md:gap-4 lg:columns-3">
            {filtered.map((photo, index) => (
              <GalleryCard
                key={photo.src}
                photo={photo}
                index={index}
                onOpen={openPhoto}
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
        />
      ) : null}
    </section>
  );
}
