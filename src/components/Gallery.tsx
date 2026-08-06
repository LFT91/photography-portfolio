"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  applyDraftToList,
  useAdmin,
} from "@/components/AdminProvider";
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

/** Absolute layout ceiling: 3× a base column ≈ full row on desktop. */
const SCALE_MIN = 0.45;
const SCALE_LAYOUT_MAX = 3;

function clampScale(n: number, max = SCALE_LAYOUT_MAX) {
  return Math.round(Math.min(max, Math.max(SCALE_MIN, n)) * 100) / 100;
}

/** Largest scale that stays sharp for this file at the current column width. */
function qualityMaxScale(naturalWidth: number, baseCellWidth: number) {
  if (!naturalWidth || baseCellWidth <= 0) return SCALE_LAYOUT_MAX;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  // Stop when CSS width would exceed native pixels (1:1 device pixels).
  const max = naturalWidth / (dpr * baseCellWidth);
  return clampScale(max, SCALE_LAYOUT_MAX);
}

function useGalleryLayout() {
  const [cols, setCols] = useState(1);
  const [baseCellWidth, setBaseCellWidth] = useState(320);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCols = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setCols(3);
      else if (window.matchMedia("(min-width: 640px)").matches) setCols(2);
      else setCols(1);
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const measure = () => {
      const styles = getComputedStyle(el);
      const gap = parseFloat(styles.columnGap || styles.gap || "16") || 16;
      const w = el.clientWidth;
      setBaseCellWidth(Math.max(1, (w - gap * (cols - 1)) / cols));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cols]);

  return { cols, baseCellWidth, galleryRef };
}

type ResizeEdge =
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

function resizeDelta(edge: ResizeEdge, dx: number, dy: number, colW: number) {
  switch (edge) {
    case "left":
      return -dx / colW;
    case "right":
      return dx / colW;
    case "top-left":
      return (-dx - dy) / 2 / colW;
    case "top-right":
      return (dx - dy) / 2 / colW;
    case "bottom-left":
      return (-dx + dy) / 2 / colW;
    case "bottom-right":
      return (dx + dy) / 2 / colW;
  }
}

function ResizeHandle({
  edge,
  cursor,
  className,
  label,
  scalePct,
  scalePctMax,
  onResize,
}: {
  edge: ResizeEdge;
  cursor: string;
  className: string;
  label: string;
  scalePct: number;
  scalePctMax: number;
  onResize: (edge: ResizeEdge, e: ReactPointerEvent) => void;
}) {
  return (
    <div
      role="slider"
      aria-label={label}
      aria-valuemin={45}
      aria-valuemax={scalePctMax}
      aria-valuenow={scalePct}
      tabIndex={0}
      onPointerDown={(e) => onResize(edge, e)}
      className={`absolute z-20 touch-none ${cursor} ${className}`}
    />
  );
}

function GalleryUploadZone({
  room,
  onError,
}: {
  room: PhotoCategory;
  onError: (msg: string | null) => void;
}) {
  const { queueUpload, saving } = useAdmin();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    onError(null);
    for (const file of Array.from(list)) {
      const err = queueUpload(file, [room]);
      if (err) {
        onError(err);
        break;
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="mb-8">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => addFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={saving}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center gap-2 border border-dashed px-4 py-10 text-center transition-colors disabled:opacity-50 ${
          dragOver
            ? "border-ember bg-ember/10 text-ember"
            : "border-line text-paper-dim hover:border-fog hover:text-paper"
        }`}
      >
        <span className="font-brand text-sm tracking-[0.06em]">
          Drop photos here, or click to add to {room}
        </span>
        <span className="font-brand text-xs text-fog">
          Staged until you Save below
        </span>
      </button>
    </div>
  );
}

function GalleryCard({
  photo,
  index,
  total,
  onOpen,
  editing,
  busy,
  baseCellWidth,
  onMove,
  onRemove,
  onScale,
  onTitle,
  onDropAt,
  dragOver,
  onDragHover,
}: {
  photo: Photo;
  index: number;
  total: number;
  onOpen: (photo: Photo) => void;
  editing: boolean;
  busy: boolean;
  baseCellWidth: number;
  onMove: (from: number, direction: -1 | 1) => void;
  onRemove: (photo: Photo) => void;
  onScale: (photo: Photo, next: number) => void;
  onTitle: (photo: Photo, title: string) => void;
  onDropAt: (from: number, to: number) => void;
  dragOver: boolean;
  onDragHover: (index: number | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const [soft, setSoft] = useState(false);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const qualityMax = qualityMaxScale(naturalWidth, baseCellWidth);
  const savedScale = clampScale(photo.displayScale ?? 1, qualityMax);
  const [liveScale, setLiveScale] = useState(savedScale);
  const liveScaleRef = useRef(savedScale);
  const resizingRef = useRef(false);
  const pending = Boolean(photo.id?.startsWith("pending:"));

  useEffect(() => {
    if (resizingRef.current) return;
    setLiveScale(savedScale);
    liveScaleRef.current = savedScale;
  }, [savedScale]);

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

  useEffect(() => {
    const wrap = imgWrapRef.current;
    if (!wrap) return;
    const img = wrap.querySelector("img");
    if (!img) return;

    const check = () => {
      const natural = img.naturalWidth;
      if (natural > 0) setNaturalWidth(natural);
      const shown = img.clientWidth * (window.devicePixelRatio || 1);
      setSoft(natural > 0 && shown > natural);
    };

    if (img.complete) check();
    else img.addEventListener("load", check);
    window.addEventListener("resize", check);
    return () => {
      img.removeEventListener("load", check);
      window.removeEventListener("resize", check);
    };
  }, [photo.src, liveScale, baseCellWidth]);

  useEffect(() => {
    if (resizingRef.current) return;
    const next = clampScale(liveScaleRef.current, qualityMax);
    if (Math.abs(next - liveScaleRef.current) >= 0.01) {
      liveScaleRef.current = next;
      setLiveScale(next);
    }
  }, [qualityMax]);

  const startResize = (edge: ResizeEdge, e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy || baseCellWidth <= 0) return;

    resizingRef.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startScale = liveScaleRef.current;
    const max = qualityMaxScale(naturalWidth, baseCellWidth);
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const onPtrMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const next = clampScale(
        startScale + resizeDelta(edge, dx, dy, baseCellWidth),
        max,
      );
      liveScaleRef.current = next;
      setLiveScale(next);
    };

    const onUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId);
      target.removeEventListener("pointermove", onPtrMove);
      target.removeEventListener("pointerup", onUp);
      target.removeEventListener("pointercancel", onUp);
      resizingRef.current = false;
      const next = liveScaleRef.current;
      if (Math.abs(next - savedScale) >= 0.01) onScale(photo, next);
    };

    target.addEventListener("pointermove", onPtrMove);
    target.addEventListener("pointerup", onUp);
    target.addEventListener("pointercancel", onUp);
  };

  const scalePct = Math.round(liveScale * 100);
  const scalePctMax = Math.round(qualityMax * 100);
  const tileWidth =
    baseCellWidth > 0
      ? `min(100%, ${Math.round(baseCellWidth * liveScale * 10) / 10}px)`
      : `${Math.round(liveScale * 1000) / 10}%`;

  return (
    <div
      ref={ref}
      className={`gallery-item group relative shrink-0 ${
        editing ? "is-editing" : ""
      } ${dragOver ? "outline outline-1 outline-ember/70 outline-offset-2" : ""} ${
        pending ? "opacity-90" : ""
      }`}
      style={{
        transitionDelay: `${(index % 6) * 60}ms`,
        width: tileWidth,
        maxWidth: "100%",
      }}
      onDragOver={
        editing
          ? (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              onDragHover(index);
            }
          : undefined
      }
      onDragLeave={
        editing
          ? (e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                onDragHover(null);
              }
            }
          : undefined
      }
      onDrop={
        editing
          ? (e) => {
              e.preventDefault();
              onDragHover(null);
              const from = Number(e.dataTransfer.getData("text/photo-index"));
              if (Number.isFinite(from) && from !== index) onDropAt(from, index);
            }
          : undefined
      }
    >
      <div className="w-full">
        <div
          ref={imgWrapRef}
          className={`relative w-full bg-ink-soft ${
            editing && !busy ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          draggable={editing && !busy}
          onDragStart={
            editing
              ? (e) => {
                  if (resizingRef.current) {
                    e.preventDefault();
                    return;
                  }
                  e.dataTransfer.setData("text/photo-index", String(index));
                  e.dataTransfer.effectAllowed = "move";
                  const card = ref.current;
                  if (card) {
                    requestAnimationFrame(() => {
                      card.style.opacity = "1";
                    });
                  }
                }
              : undefined
          }
          onDoubleClick={
            editing
              ? (e) => {
                  e.preventDefault();
                  if (Math.abs(liveScale - 1) < 0.01) return;
                  setLiveScale(1);
                  liveScaleRef.current = 1;
                  onScale(photo, 1);
                }
              : undefined
          }
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="relative w-full overflow-hidden">
            {editing ? (
              <ProtectedImage
                src={photo.src}
                alt={photo.title}
                width={1600}
                height={1200}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="pointer-events-none h-auto w-full"
                style={{ width: "100%", height: "auto" }}
                draggable={false}
              />
            ) : (
              <button
                type="button"
                onClick={() => onOpen(photo)}
                onContextMenu={(e) => e.preventDefault()}
                className="block w-full overflow-hidden text-left"
              >
                <ProtectedImage
                  src={photo.src}
                  alt={photo.title}
                  width={1600}
                  height={1200}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="h-auto w-full"
                  style={{ width: "100%", height: "auto" }}
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100">
                  <p className="font-display text-xl italic text-paper">
                    {photo.title}
                  </p>
                  <p className="mt-1 font-brand text-sm tracking-[0.08em] text-paper-dim">
                    {photo.categories.join(" · ")}
                  </p>
                </div>
              </button>
            )}
          </div>

          {editing ? (
            <>
              <ResizeHandle
                edge="left"
                cursor="cursor-ew-resize"
                className="top-3 bottom-3 left-0 w-3 sm:w-3.5"
                label="Resize from left"
                scalePct={scalePct}
                scalePctMax={scalePctMax}
                onResize={startResize}
              />
              <ResizeHandle
                edge="right"
                cursor="cursor-ew-resize"
                className="top-3 bottom-3 right-0 w-3 sm:w-3.5"
                label="Resize from right"
                scalePct={scalePct}
                scalePctMax={scalePctMax}
                onResize={startResize}
              />
              <ResizeHandle
                edge="top-left"
                cursor="cursor-nwse-resize"
                className="top-0 left-0 h-4 w-4 sm:h-5 sm:w-5"
                label="Resize from top-left"
                scalePct={scalePct}
                scalePctMax={scalePctMax}
                onResize={startResize}
              />
              <ResizeHandle
                edge="top-right"
                cursor="cursor-nesw-resize"
                className="top-0 right-0 h-4 w-4 sm:h-5 sm:w-5"
                label="Resize from top-right"
                scalePct={scalePct}
                scalePctMax={scalePctMax}
                onResize={startResize}
              />
              <ResizeHandle
                edge="bottom-left"
                cursor="cursor-nesw-resize"
                className="bottom-0 left-0 h-4 w-4 sm:h-5 sm:w-5"
                label="Resize from bottom-left"
                scalePct={scalePct}
                scalePctMax={scalePctMax}
                onResize={startResize}
              />
              <ResizeHandle
                edge="bottom-right"
                cursor="cursor-nwse-resize"
                className="right-0 bottom-0 h-4 w-4 sm:h-5 sm:w-5"
                label="Resize from bottom-right"
                scalePct={scalePct}
                scalePctMax={scalePctMax}
                onResize={startResize}
              />

              <span className="pointer-events-none absolute top-0.5 left-0.5 h-2.5 w-2.5 border-t border-l border-paper/90" />
              <span className="pointer-events-none absolute top-0.5 right-0.5 h-2.5 w-2.5 border-t border-r border-paper/90" />
              <span className="pointer-events-none absolute bottom-0.5 left-0.5 h-2.5 w-2.5 border-b border-l border-paper/90" />
              <span className="pointer-events-none absolute right-0.5 bottom-0.5 h-2.5 w-2.5 border-r border-b border-paper/90" />
              <span className="pointer-events-none absolute top-1/2 left-0.5 h-8 w-1 -translate-y-1/2 rounded-full bg-paper/75" />
              <span className="pointer-events-none absolute top-1/2 right-0.5 h-8 w-1 -translate-y-1/2 rounded-full bg-paper/75" />

              {pending ? (
                <p className="pointer-events-none absolute top-2 left-2 rounded bg-ink/80 px-2 py-1 font-brand text-[10px] tracking-[0.06em] text-ember">
                  New
                </p>
              ) : null}
            </>
          ) : null}

          {editing && (soft || liveScale >= qualityMax - 0.01) ? (
            <p className="pointer-events-none absolute bottom-2 left-2 rounded bg-ink/80 px-2 py-1 font-brand text-[10px] tracking-[0.06em] text-ember/90">
              {liveScale >= qualityMax - 0.01
                ? "Max sharp size for this file"
                : "Soft — past native resolution"}
            </p>
          ) : null}
        </div>
      </div>

      {editing ? (
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={photo.title}
            disabled={busy}
            onChange={(e) => onTitle(photo, e.target.value)}
            aria-label="Photo title"
            className="w-full border border-line bg-transparent px-3 py-2 font-display text-lg italic text-paper outline-none focus:border-ember disabled:opacity-50"
          />
          <div className="flex flex-wrap items-center justify-center gap-1">
            <button
              type="button"
              disabled={busy || index === 0}
              onClick={() => onMove(index, -1)}
              className="border border-line bg-ink/85 px-2 py-1 font-brand text-sm text-paper disabled:opacity-30"
              aria-label="Move earlier"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={busy || index >= total - 1}
              onClick={() => onMove(index, 1)}
              className="border border-line bg-ink/85 px-2 py-1 font-brand text-sm text-paper disabled:opacity-30"
              aria-label="Move later"
            >
              ↓
            </button>
            <span className="min-w-10 text-center font-brand text-xs text-fog tabular-nums">
              {scalePct}%
            </span>
            <button
              type="button"
              disabled={busy || !photo.id}
              onClick={() => onRemove(photo)}
              className="border border-line bg-ink/85 px-2 py-1 font-brand text-sm text-ember disabled:opacity-30"
              aria-label="Delete photo"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </div>
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
  const {
    editing,
    draft,
    saving,
    setPhotoTitle,
    setPhotoScale,
    markDeleted,
    setViewOrder,
  } = useAdmin();
  const { baseCellWidth, galleryRef } = useGalleryLayout();
  const source = items ?? photos;
  const [filter, setFilter] = useState<PhotoCategory>(
    lockedCategory ?? categories[0],
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const room = lockedCategory ?? filter;

  const filtered = useMemo(() => {
    const list = source.filter((p) => photoInCategory(p, room));
    return applyDraftToList(list, room, draft);
  }, [draft, room, source]);

  const selectFilter = (category: PhotoCategory) => {
    setFilter(category);
    setActiveIndex(null);
  };

  const openPhoto = (photo: Photo) => {
    const i = filtered.findIndex((p) => p.src === photo.src);
    if (i >= 0) setActiveIndex(i);
  };

  const onMove = (from: number, direction: -1 | 1) => {
    const to = from + direction;
    if (to < 0 || to >= filtered.length) return;
    const next = [...filtered];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setViewOrder(room, next);
  };

  const onDropAt = (from: number, to: number) => {
    setDragOverIndex(null);
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= filtered.length ||
      to >= filtered.length
    )
      return;
    const next = [...filtered];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setViewOrder(room, next);
  };

  const onRemove = (photo: Photo) => {
    if (!window.confirm(`Remove “${photo.title}”? (Save to confirm)`)) return;
    markDeleted(photo);
  };

  const onScale = (photo: Photo, next: number) => {
    setPhotoScale(photo, next);
  };

  const onTitle = (photo: Photo, next: string) => {
    setPhotoTitle(photo, next);
  };

  const showHeader =
    Boolean(title) || (showFilters && !lockedCategory) || highlightAfterDark;

  return (
    <section
      className={`relative bg-ink px-5 pb-16 sm:px-8 sm:pb-24 ${
        tightTop ? "pt-6 sm:pt-8" : "pt-10 sm:pt-14"
      } ${editing ? "pb-28 sm:pb-32" : ""}`}
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
              <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row md:items-center md:justify-end md:gap-x-8">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-6">
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
                </div>
                {highlightAfterDark ? (
                  <Link
                    href="/after-dark"
                    className="font-brand w-full text-center text-sm tracking-[0.08em] text-ember transition-colors hover:text-[#e0c08a] md:w-auto md:text-left"
                  >
                    After Dark
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {editing ? (
          <>
            <GalleryUploadZone room={room} onError={setAdminError} />
            <p className="mb-6 font-brand text-sm text-fog">
              Drag to reorder · edges/corners resize (grows until the file would
              look soft) · double-click resets to 100% · edit title · ✕ stages
              delete. Neighbours reflow as you resize. Save or Cancel below.
            </p>
          </>
        ) : null}
        {adminError ? (
          <p className="mb-6 font-brand text-sm text-ember">{adminError}</p>
        ) : null}

        {filtered.length === 0 ? (
          <p className="font-brand text-paper-dim">
            No photos in this section yet.
          </p>
        ) : (
          <div
            ref={galleryRef}
            className="flex flex-wrap content-start items-start gap-3 sm:gap-4"
          >
            {filtered.map((photo, index) => (
              <GalleryCard
                key={photo.id ?? photo.src}
                photo={photo}
                index={index}
                total={filtered.length}
                onOpen={openPhoto}
                editing={editing}
                busy={saving}
                baseCellWidth={baseCellWidth}
                onMove={onMove}
                onRemove={onRemove}
                onScale={onScale}
                onTitle={onTitle}
                onDropAt={onDropAt}
                dragOver={dragOverIndex === index}
                onDragHover={setDragOverIndex}
              />
            ))}
          </div>
        )}
      </div>

      {activeIndex != null && !editing ? (
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
