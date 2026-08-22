import Link from "next/link";
import { ArtistStagePrint } from "@/components/ArtistStagePrint";
import { ProtectedImage } from "@/components/ProtectedImage";
import type { Photo } from "@/data/photos";
import { heroPhotograph } from "@/lib/catalog";
import { isAyoubSite } from "@/lib/site";

function FatniHero() {
  const hero = heroPhotograph();
  return (
    <section className="relative flex h-svh items-center justify-center overflow-hidden">
      <div className="absolute inset-0 animate-hero-image">
        <ProtectedImage
          src={hero.src}
          alt={hero.title}
          fill
          priority
          sizes="100vw"
          className="pointer-events-none object-cover object-[center_35%] scale-105"
        />
      </div>

      {/* Keep the photo visible, but darken behind the text so type stays readable */}
      <div className="absolute inset-0 bg-ink/25" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,12,14,0.72)_0%,rgba(11,12,14,0.35)_45%,rgba(11,12,14,0.2)_100%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-5 pt-8 text-center sm:px-8">
        <h1 className="animate-rise delay-1 font-brand text-5xl font-medium leading-[1.05] tracking-[0.02em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)] sm:text-7xl lg:text-8xl">
          Fatni Photography
        </h1>
        <div className="animate-rise delay-2 mt-10 sm:mt-12">
          <Link
            href="/work"
            className="inline-flex items-center gap-3 border border-white/70 bg-black/45 px-7 py-3.5 font-brand text-lg tracking-[0.06em] text-white shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-colors hover:border-ember hover:bg-ember/20 hover:text-ember sm:px-8 sm:py-4 sm:text-xl"
          >
            Explore work
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Ayoub: contained homepage photograph on black + ENTER.
 * Brand name lives only in the header.
 */
function AyoubHero({ cover }: { cover?: Photo | null }) {
  return (
    <section className="relative flex h-svh items-center justify-center overflow-hidden bg-ink">
      {cover ? (
        <div className="relative inline-flex">
          <ArtistStagePrint
            src={cover.src}
            alt=""
            priority
            mode="height"
            blend="beams"
          />
          {/* Anchored to the lit window bay on the façade print */}
          <Link
            href="/projects/after-dark"
            className="animate-rise delay-2 absolute left-[44.35%] top-[51.5%] z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 border border-white/50 bg-black/45 px-5 py-2.5 font-brand text-xs tracking-[0.16em] text-white/95 backdrop-blur-[2px] transition-colors hover:border-white hover:text-white sm:gap-3 sm:px-6 sm:py-3 sm:text-sm"
          >
            ENTER
            <span aria-hidden>→</span>
          </Link>
        </div>
      ) : (
        <>
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,29,34,0.9)_0%,rgba(11,12,14,1)_70%)]"
            aria-hidden
          />
          <div className="relative z-10 mx-auto flex w-full max-w-3xl justify-center px-5 sm:px-8">
            <Link
              href="/projects/after-dark"
              className="animate-rise delay-2 inline-flex items-center gap-3 border border-white/55 bg-black/45 px-6 py-3 font-brand text-sm tracking-[0.16em] text-white/95 transition-colors hover:border-white hover:text-white"
            >
              ENTER
              <span aria-hidden>→</span>
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

export function Hero({ ayoubCover = null }: { ayoubCover?: Photo | null }) {
  return isAyoubSite() ? <AyoubHero cover={ayoubCover} /> : <FatniHero />;
}
