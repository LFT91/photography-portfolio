import { Footer } from "@/components/Footer";
import { PhotoGrid } from "@/components/PhotoGrid";
import type { Photo } from "@/lib/photo";

const AYOUB_STATEMENT =
  "After Dark brings together photographs made in those moments when reality seems to shift slightly out of register. Made over several years, the series follows that instability across different places, encounters and conditions.";

export function AfterDark({ items }: { items: Photo[] }) {
  const count = items.length;
  const countLabel = count === 1 ? "1 photograph" : `${count} photographs`;

  return (
    <div className="min-h-svh bg-ink">
      <header className="px-5 pt-[4.75rem] pb-5 sm:px-8 sm:pt-[5.5rem] sm:pb-6">
        <div className="mx-auto max-w-3xl text-center sm:max-w-4xl">
          <h1 className="animate-rise delay-1 font-display text-[2.75rem] italic leading-[1.08] text-paper sm:text-5xl">
            After Dark
          </h1>
          <p className="animate-rise delay-2 mx-auto mt-5 max-w-3xl font-brand text-lg leading-[1.75] text-paper/90 sm:mt-6 sm:max-w-4xl sm:text-[1.25rem] sm:leading-[1.8]">
            {AYOUB_STATEMENT}
          </p>
          {count > 0 ? (
            <p className="animate-rise delay-3 mt-5 font-brand text-sm tracking-[0.14em] text-fog uppercase">
              {countLabel}
            </p>
          ) : (
            <p className="mt-8 font-brand text-paper-dim">
              No photographs in this project yet.
            </p>
          )}
        </div>
      </header>

      {count > 0 ? (
        <PhotoGrid
          items={items}
          compactTop
          sectionId="after-dark-photographs"
          layout="ayoub"
        />
      ) : null}

      <Footer />
    </div>
  );
}
