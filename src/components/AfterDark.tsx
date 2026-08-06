"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { ProtectedImage } from "@/components/ProtectedImage";
import type { Photo } from "@/data/photos";

export function AfterDark({
  items,
  cover,
}: {
  items: Photo[];
  cover: Photo;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    document.body.style.overflow = entered ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [entered]);

  if (!entered) {
    return (
      <section className="relative flex h-svh items-center justify-center overflow-hidden">
        <div className="absolute inset-0 animate-hero-image">
          <ProtectedImage
            src={cover.src}
            alt={cover.title}
            fill
            priority
            sizes="100vw"
            className="pointer-events-none object-contain object-center"
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
            After Dark series is a project showcasing the artist&apos;s vision of
            the world after nightfall. He has been fascinated by the
            world after dark for a long time due to its unique rhythm and
            atmosphere.
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
            After Dark series is a project showcasing the artist&apos;s vision of
            the world after nightfall. He has been fascinated by the
            world after dark for a long time due to its unique rhythm and
            atmosphere.
          </p>
        </div>
      </div>

      <Gallery
        lockedCategory="After Dark"
        showFilters={false}
        title=""
        tightTop
        items={items}
      />

      <Footer />
    </div>
  );
}
