import Link from "next/link";
import { fatniAdjacent } from "@/content/collections";

/** Quiet prev/next between Fatni archive rooms (excludes After Dark). */
export function CollectionAdjacentNav({ slug }: { slug: string }) {
  const { prev, next } = fatniAdjacent(slug);
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Other collections"
      className="mx-auto flex max-w-7xl items-center justify-between gap-6 border-t border-line/60 px-5 py-10 sm:px-8 sm:py-12"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="font-brand text-sm tracking-[0.1em] text-fog transition-colors hover:text-paper"
        >
          <span aria-hidden className="mr-2">
            ←
          </span>
          {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className="ml-auto font-brand text-sm tracking-[0.1em] text-fog transition-colors hover:text-paper"
        >
          {next.title}
          <span aria-hidden className="ml-2">
            →
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
