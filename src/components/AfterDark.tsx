"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { ProtectedImage } from "@/components/ProtectedImage";
import type { Photo } from "@/data/photos";

const FATNI_STATEMENT =
  "After Dark series is a project showcasing the artist's vision of the world after nightfall. He has been fascinated by the world after dark for a long time due to its unique rhythm and atmosphere.";

const AYOUB_STATEMENT =
  "After Dark brings together photographs made in those moments when reality seems to shift slightly out of register. Made over several years, the series follows that instability across different places, encounters and conditions.";

export function AfterDark({
  items,
  cover,
  variant = "fatni",
}: {
  items: Photo[];
  /** Required for Fatni entrance gate when items are present. */
  cover?: Photo | null;
  /** Ayoub gets distinct copy; Fatni keeps the original entrance gate. */
  variant?: "fatni" | "ayoub";
}) {
  const [entered, setEntered] = useState(false);
  const empty = items.length === 0;
  const ayoub = variant === "ayoub";
  const statement = ayoub ? AYOUB_STATEMENT : FATNI_STATEMENT;

  // Fatni only: lock scroll until Enter. Ayoub scrolls from intro into gallery.
  useEffect(() => {
    if (ayoub || empty) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = entered ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [entered, empty, ayoub]);

  if (empty) {
    return (
      <div className="min-h-svh bg-ink pt-16 sm:pt-20">
        <div className="border-b border-line px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl italic text-paper sm:text-5xl">
              After Dark
            </h1>
            <p className="mx-auto mt-5 max-w-xl font-brand text-base leading-[1.85] text-paper/90 sm:text-[1.05rem]">
              {ayoub
                ? AYOUB_STATEMENT
                : "A view of the world after nightfall — its rhythm and atmosphere."}
            </p>
            <p className="mt-8 font-brand text-paper-dim">
              No photographs in this project yet.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Ayoub: typographic project wall → gallery, no cover image.
  if (ayoub) {
    const count = items.length;
    const countLabel =
      count === 1 ? "1 photograph" : `${count} photographs`;

    return (
      <div className="min-h-svh bg-ink">
        <header className="px-5 pt-[4.75rem] pb-5 sm:px-8 sm:pt-[5.5rem] sm:pb-6">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="animate-rise delay-1 font-display text-[2.75rem] italic leading-[1.08] text-paper sm:text-5xl">
              After Dark
            </h1>
            <p className="animate-rise delay-2 mx-auto mt-5 max-w-xl font-brand text-base leading-[1.85] text-paper/90 sm:mt-6 sm:text-[1.05rem] sm:leading-[1.9]">
              {AYOUB_STATEMENT}
            </p>
            <p className="animate-rise delay-3 mt-5 font-brand text-xs tracking-[0.16em] text-fog uppercase">
              {countLabel}
            </p>
          </div>
        </header>

        <Gallery
          lockedCategory="After Dark"
          showFilters={false}
          title=""
          compactTop
          sectionId="after-dark-photographs"
          items={items}
          presentation="ayoub"
        />

        <Footer />
      </div>
    );
  }

  if (!entered && cover) {
    return (
      <section className="relative flex h-svh items-center justify-center overflow-hidden">
        <div className="absolute inset-0 animate-hero-image">
          <ProtectedImage
            src={cover.src}
            alt={cover.title}
            fill
            priority
            sizes="100vw"
            className="pointer-events-none object-cover object-center scale-105"
          />
        </div>

        <div className="absolute inset-0 bg-ink/30" aria-hidden />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,12,14,0.75)_0%,rgba(11,12,14,0.35)_50%,rgba(11,12,14,0.25)_100%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center px-5 text-center sm:px-8">
          <p className="animate-rise delay-1 mb-4 font-brand text-xs tracking-[0.32em] text-ember uppercase sm:text-sm">
            A project
          </p>
          <h1 className="animate-rise delay-2 font-display text-4xl italic leading-[1.15] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)] sm:text-5xl">
            After Dark
          </h1>
          <p className="animate-rise delay-3 mt-6 max-w-md font-brand text-sm leading-[1.75] text-white/78 drop-shadow-[0_1px_10px_rgba(0,0,0,0.65)] sm:text-[0.95rem]">
            {statement}
          </p>
          <button
            type="button"
            onClick={() => setEntered(true)}
            className="animate-rise delay-4 mt-10 inline-flex items-center gap-2 border border-white/55 bg-black/40 px-6 py-3 font-brand text-sm tracking-[0.14em] text-white/95 backdrop-blur-sm transition-colors hover:border-ember hover:bg-ember/15 hover:text-ember"
          >
            Enter
            <span aria-hidden>→</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="animate-fade min-h-svh bg-ink pt-16 sm:pt-20">
      <div className="border-b border-line px-5 py-10 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 font-brand text-sm tracking-[0.28em] text-ember uppercase">
            Project
          </p>
          <h1 className="font-display text-4xl italic text-paper sm:text-5xl">
            After Dark
          </h1>
          <p className="mt-4 max-w-lg font-brand text-sm leading-[1.75] text-paper-dim sm:text-[0.95rem]">
            {FATNI_STATEMENT}
          </p>
        </div>
      </div>

      <Gallery
        lockedCategory="After Dark"
        showFilters={false}
        title=""
        tightTop
        items={items}
        presentation="default"
      />

      <Footer />
    </div>
  );
}
