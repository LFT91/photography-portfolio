import Link from "next/link";
import { ProtectedImage } from "@/components/ProtectedImage";
import { heroImage } from "@/data/photos";
import { getActiveSite, isAyoubSite } from "@/lib/site";

function FatniHero() {
  return (
    <section className="relative flex h-svh items-center justify-center overflow-hidden">
      <div className="absolute inset-0 animate-hero-image">
        <ProtectedImage
          src={heroImage.src}
          alt={heroImage.title}
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
        <p className="animate-rise delay-2 mx-auto mt-5 max-w-md text-base leading-relaxed text-white/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] sm:text-lg">
          Nature, street, architecture, and night.
        </p>
        <div className="animate-rise delay-3 mt-10 sm:mt-12">
          <Link
            href="/work"
            className="inline-flex items-center gap-3 border border-white/70 bg-black/45 px-7 py-3.5 font-brand text-lg tracking-[0.06em] text-white shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-colors hover:border-ember hover:bg-ember/20 hover:text-ember sm:px-8 sm:py-4 sm:text-xl"
          >
            View work
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Quiet artist landing — no stock/Fatni imagery while Selected Work is empty. */
function AyoubHero() {
  const { name } = getActiveSite();

  return (
    <section className="relative flex h-svh items-center justify-center overflow-hidden bg-ink">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,29,34,0.9)_0%,rgba(11,12,14,1)_70%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 text-center sm:px-8">
        <h1 className="animate-rise delay-1 font-brand text-5xl font-medium leading-[1.05] tracking-[0.02em] text-paper sm:text-7xl lg:text-8xl">
          {name}
        </h1>
        <div className="animate-rise delay-2 mt-12 sm:mt-14">
          <Link
            href="/work"
            className="inline-flex items-center gap-3 border border-paper/35 px-6 py-3 font-brand text-sm tracking-[0.16em] text-paper/90 transition-colors hover:border-ember hover:text-ember sm:text-base"
          >
            Selected Work
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Hero() {
  return isAyoubSite() ? <AyoubHero /> : <FatniHero />;
}
