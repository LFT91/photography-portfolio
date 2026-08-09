"use client";

import { useEffect, useState } from "react";
import { ArtistStagePrint } from "@/components/ArtistStagePrint";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { ProtectedImage } from "@/components/ProtectedImage";
import type { Photo } from "@/data/photos";

const FATNI_STATEMENT =
  "After Dark series is a project showcasing the artist's vision of the world after nightfall. He has been fascinated by the world after dark for a long time due to its unique rhythm and atmosphere.";

const AYOUB_STATEMENT =
  "After Dark is a study of the city when artificial light becomes structure. Rain, fog and passing figures turn familiar streets into brief, isolated scenes.";

export function AfterDark({
  items,
  cover,
  variant = "fatni",
}: {
  items: Photo[];
  /** Required when items are present; omitted for empty collections. */
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
          <div className="mx-auto max-w-7xl">
            <p className="mb-3 font-brand text-sm tracking-[0.28em] text-ember uppercase">
              Project
            </p>
            <h1 className="font-display text-4xl italic text-paper sm:text-5xl">
              After Dark
            </h1>
            <p className="mt-6 max-w-lg font-brand text-sm leading-[1.75] text-paper-dim sm:text-[0.95rem]">
              {ayoub
                ? AYOUB_STATEMENT
                : "A view of the world after nightfall — its rhythm and atmosphere."}
            </p>
            <p className="mt-10 font-brand text-paper-dim">
              No photographs in this project yet.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Ayoub: Night Train introduction then gallery in one scrollable page (no second ENTER).
  if (ayoub) {
    return (
      <div className="min-h-svh bg-ink">
        {cover ? (
          <section className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-ink">
            <div className="absolute inset-0 flex items-center justify-center px-3 sm:px-6">
              <ArtistStagePrint
                src={cover.src}
                alt={cover.title}
                priority
                mode="width"
                blend="night"
              />
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center px-5 text-center sm:px-8">
              <h1 className="animate-rise delay-1 font-display text-4xl italic leading-[1.15] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)] sm:text-5xl">
                After Dark
              </h1>
              <p className="animate-rise delay-2 mt-6 max-w-md font-brand text-sm leading-[1.75] text-white/78 drop-shadow-[0_1px_10px_rgba(0,0,0,0.65)] sm:text-[0.95rem]">
                {AYOUB_STATEMENT}
              </p>
            </div>
          </section>
        ) : (
          <div className="px-5 pb-2 pt-20 sm:px-8 sm:pt-24">
            <div className="mx-auto max-w-7xl">
              <h1 className="font-display text-3xl italic text-paper sm:text-4xl">
                After Dark
              </h1>
              <p className="mt-6 max-w-lg font-brand text-sm leading-[1.75] text-paper-dim sm:text-[0.95rem]">
                {AYOUB_STATEMENT}
              </p>
            </div>
          </div>
        )}

        <Gallery
          lockedCategory="After Dark"
          showFilters={false}
          title=""
          tightTop
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
