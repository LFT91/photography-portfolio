import Link from "next/link";
import { ProtectedImage } from "@/components/ProtectedImage";
import type { FatniCollectionSummary } from "@/lib/fatni-collections";

type CollectionIndexProps = {
  collections: FatniCollectionSummary[];
  heading?: string;
  intro?: string;
  /** Tighter section for homepage preview under the hero. */
  preview?: boolean;
};

/**
 * Photographic collection index — book/index feel, not dashboard cards.
 * 1 / 2 / 3 columns on mobile / tablet / desktop.
 */
export function CollectionIndex({
  collections,
  heading = "Work",
  intro,
  preview = false,
}: CollectionIndexProps) {
  return (
    <section
      className={`bg-ink px-5 sm:px-8 ${
        preview ? "pb-20 pt-16 sm:pb-28 sm:pt-20" : "pb-20 pt-6 sm:pb-28 sm:pt-8"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <div className={preview ? "mb-10 sm:mb-14" : "mb-12 sm:mb-16"}>
          {preview ? (
            <h2 className="font-display text-3xl italic text-paper sm:text-4xl">
              {heading}
            </h2>
          ) : (
            <h1 className="font-display text-4xl italic text-paper sm:text-5xl">
              {heading}
            </h1>
          )}
          {intro ? (
            <p className="mt-3 max-w-xl font-brand text-base text-paper-dim sm:text-lg">
              {intro}
            </p>
          ) : null}
        </div>

        {collections.length === 0 ? (
          <p className="font-brand text-paper-dim">No collections yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-x-5 gap-y-10 md:grid-cols-2 md:gap-x-6 md:gap-y-12 lg:grid-cols-3 lg:gap-x-7 lg:gap-y-14">
            {collections.map((collection, index) => (
              <li key={collection.slug}>
                <Link
                  href={collection.href}
                  className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper/60"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-ink-soft">
                    {collection.cover ? (
                      <ProtectedImage
                        src={collection.cover.src}
                        alt={collection.cover.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        priority={preview ? index < 3 : index < 3}
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-ink-soft" aria-hidden />
                    )}
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100"
                      aria-hidden
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <p className="font-display text-2xl italic text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.65)] sm:text-3xl">
                        {collection.title}
                      </p>
                      <p className="mt-1 font-brand text-xs tracking-[0.14em] text-white/70">
                        {collection.count === 1
                          ? "1 photograph"
                          : `${collection.count} photographs`}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {preview ? (
          <div className="mt-12 sm:mt-16">
            <Link
              href="/work"
              className="inline-flex items-center gap-2 font-brand text-sm tracking-[0.12em] text-paper-dim transition-colors hover:text-paper"
            >
              All collections
              <span aria-hidden>→</span>
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
