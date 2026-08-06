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

const PAGE_SIZE = 9;

function Lightbox({
  photo,
  onClose,
}: {
  photo: Photo;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-ink/92 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 font-brand text-sm tracking-[0.08em] text-paper-dim transition-colors hover:text-paper"
      >
        Close
      </button>
      <div
        className="relative max-h-[85svh] w-full max-w-6xl"
        onClick={onClose}
      >
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
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
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <h3 className="font-display text-2xl italic text-paper">
            {photo.title}
          </h3>
          <p className="font-brand text-sm tracking-[0.08em] text-fog">
            {photo.categories.join(" · ")}
          </p>
        </div>
      </div>
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
      style={{ transitionDelay: `${(index % 4) * 80}ms` }}
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

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
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
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<Photo | null>(null);

  const filtered = useMemo(() => {
    const activeCategory = lockedCategory ?? filter;
    const list = source.filter((p) => photoInCategory(p, activeCategory));
    return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [filter, lockedCategory, source]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagePhotos = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectFilter = (category: PhotoCategory) => {
    setFilter(category);
    setPage(1);
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

        {pagePhotos.length === 0 ? (
          <p className="font-brand text-paper-dim">
            No photos in this section yet.
          </p>
        ) : (
          <div className="columns-1 gap-3 md:columns-2 md:gap-4 lg:columns-3">
            {pagePhotos.map((photo, index) => (
              <GalleryCard
                key={`${photo.src}-${currentPage}`}
                photo={photo}
                index={index}
                onOpen={setActive}
              />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <nav
            className="mt-14 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
            aria-label="Gallery pages"
          >
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="font-brand px-3 py-2 text-sm text-paper-dim transition-colors hover:text-paper disabled:pointer-events-none disabled:opacity-30"
            >
              Prev
            </button>

            {pageList(currentPage, totalPages).map((item, index) =>
              item === "…" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1 text-fog"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToPage(item)}
                  aria-current={item === currentPage ? "page" : undefined}
                  className={`min-w-10 px-3 py-2 font-brand text-sm transition-colors ${
                    item === currentPage
                      ? "border-b border-ember text-paper"
                      : "text-fog hover:text-paper"
                  }`}
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="font-brand px-3 py-2 text-sm text-paper-dim transition-colors hover:text-paper disabled:pointer-events-none disabled:opacity-30"
            >
              Next
            </button>
          </nav>
        ) : null}
      </div>

      {active ? (
        <Lightbox photo={active} onClose={() => setActive(null)} />
      ) : null}
    </section>
  );
}
