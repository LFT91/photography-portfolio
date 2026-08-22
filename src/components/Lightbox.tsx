"use client";

import { useCallback, useEffect, useRef } from "react";
import { PhotoImage } from "@/components/PhotoImage";
import type { Photo } from "@/lib/photo";

function focusables(root: HTMLElement) {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((el) => !el.hasAttribute("disabled"));
}

export function Lightbox({
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);

  const go = useCallback(
    (delta: number) => {
      if (total < 2) return;
      onChange((index + delta + total) % total);
    },
    [index, total, onChange],
  );

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      previousFocus.current?.focus();
    };
  }, []);

  useEffect(() => {
    const root = dialogRef.current;
    if (!root) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key !== "Tab") return;

      const itemsInDialog = focusables(root);
      if (!itemsInDialog.length) {
        e.preventDefault();
        return;
      }
      const first = itemsInDialog[0];
      const last = itemsInDialog[itemsInDialog.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, total, onClose, go]);

  if (!photo) return null;

  return (
    <div
      ref={dialogRef}
      className="animate-fade fixed inset-0 z-[80] flex flex-col bg-ink/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
      onClick={() => {
        if (didSwipe.current) {
          didSwipe.current = false;
          return;
        }
        onClose();
      }}
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
          ref={closeRef}
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
            <PhotoImage
              src={photo.src}
              alt={photo.title}
              variant="display"
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
