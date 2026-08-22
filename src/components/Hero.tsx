import Link from "next/link";
import { PhotoImage } from "@/components/PhotoImage";
import { isAyoubSite } from "@/lib/site";

function FatniHero() {
  return (
    <section className="relative flex h-svh items-center justify-center overflow-hidden">
      <div className="absolute inset-0 animate-hero-image">
        <PhotoImage
          src="/images/after-dark/startrails.jpg"
          alt="Star Trails"
          variant="hero"
          fill
          priority
          sizes="100vw"
          className="pointer-events-none object-cover object-[center_35%] scale-105"
        />
      </div>

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

function AyoubHero() {
  return (
    <section className="relative flex h-svh items-center justify-center overflow-hidden bg-ink">
      <div className="relative inline-flex max-h-[89svh] max-w-[96vw]">
        <PhotoImage
          src="/images/ayoub-homepage.png"
          alt=""
          variant="display"
          priority
          sizes="96vw"
          className="protect-media pointer-events-none h-auto max-h-[89svh] w-auto max-w-[96vw] select-none object-contain"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "linear-gradient(to right, rgba(11,12,14,0.97) 0%, transparent 11%, transparent 89%, rgba(11,12,14,0.97) 100%)",
              "linear-gradient(to bottom, rgba(11,12,14,0.55) 0%, transparent 9%, transparent 91%, rgba(11,12,14,0.75) 100%)",
              "radial-gradient(ellipse at center, transparent 50%, rgba(11,12,14,0.4) 100%)",
            ].join(", "),
          }}
        />
        {/* Percentages are of the print box (object-contain), so they stay on the lit window. */}
        <Link
          href="/projects/after-dark"
          className="animate-rise delay-2 absolute left-[44.35%] top-[51.5%] z-10 inline-flex min-h-11 -translate-x-1/2 -translate-y-1/2 items-center gap-2 border border-white/50 bg-black/45 px-5 py-2.5 font-brand text-xs tracking-[0.16em] text-white/95 backdrop-blur-[2px] transition-colors hover:border-white hover:text-white sm:gap-3 sm:px-6 sm:py-3 sm:text-sm"
        >
          ENTER
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}

export function Hero() {
  return isAyoubSite() ? <AyoubHero /> : <FatniHero />;
}
