import type { CSSProperties } from "react";
import { PhotoImage } from "@/components/PhotoImage";
import type { Photo } from "@/lib/photo";

function spanForScale(scale: number): 1 | 2 | 3 {
  if (scale <= 1) return 1;
  if (scale <= 2) return 2;
  return 3;
}

export function PhotoTile({
  photo,
  index,
  layout,
  priority = false,
  onOpen,
}: {
  photo: Photo;
  index: number;
  layout: "fatni" | "ayoub";
  priority?: boolean;
  onOpen: (index: number) => void;
}) {
  const ayoub = layout === "ayoub";
  const scale = photo.displayScale ?? 1;
  const span = ayoub ? 1 : spanForScale(scale);

  return (
    <li
      className="photo-tile group min-w-0"
      data-span={span}
      style={
        {
          "--scale": String(scale),
          animationDelay: `${(index % 6) * 25}ms`,
        } as CSSProperties
      }
    >
      <div className={`photo-frame mx-auto ${ayoub ? "bg-ink" : "bg-ink-soft"}`}>
        <button
          type="button"
          onClick={() => onOpen(index)}
          className={
            ayoub
              ? "relative mx-auto block max-w-full overflow-hidden text-left"
              : "relative block w-full min-w-0 overflow-hidden text-left"
          }
        >
          <PhotoImage
            src={photo.src}
            alt={photo.title}
            variant="tile"
            priority={priority}
            sizes={
              ayoub
                ? "(max-width: 768px) 100vw, 580px"
                : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            }
            className={
              ayoub
                ? "mx-auto h-auto max-h-[70svh] w-auto max-w-full object-contain"
                : "h-auto w-full max-h-[85svh] object-contain md:max-h-none"
            }
            style={
              ayoub
                ? {
                    width: "auto",
                    height: "auto",
                    maxHeight: "70svh",
                    maxWidth: "100%",
                  }
                : { width: "100%", height: "auto" }
            }
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-5 opacity-100 transition-opacity duration-500 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <p className="font-display text-xl italic text-paper">
              {photo.title}
            </p>
            {ayoub ? null : (
              <p className="mt-1 font-brand text-sm tracking-[0.08em] text-paper-dim">
                {photo.categories.join(" · ")}
              </p>
            )}
          </div>
        </button>
      </div>
    </li>
  );
}
