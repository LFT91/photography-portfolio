import { ProtectedImage } from "@/components/ProtectedImage";
import {
  AYOUB_PUBLIC_URL,
  FATNI_PUBLIC_URL,
  isAyoubSite,
} from "@/lib/site";

const awardClassName =
  "font-medium text-paper underline decoration-ember/70 decoration-1 underline-offset-4";

const sisterLinkClassName =
  "font-medium text-paper underline decoration-ember/70 decoration-1 underline-offset-4 transition-colors hover:decoration-ember";

function AwardNames() {
  return (
    <>
      <span className={awardClassName}>British Photography Awards (BPA)</span>{" "}
      and the{" "}
      <span className={awardClassName}>Monochrome Photography Awards</span>
    </>
  );
}

function FatniAbout() {
  return (
    <section className="bg-ink px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <h1 className="mb-8 font-brand text-3xl font-medium tracking-[0.02em] text-paper sm:text-4xl">
            Who I am
          </h1>
          <ProtectedImage
            src="/images/about.jpg"
            alt="Ayoub El Fatni in the forest"
            width={682}
            height={1024}
            className="h-auto w-full max-w-[22rem] object-cover sm:max-w-[26rem]"
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "68vh",
              objectFit: "cover",
            }}
            priority
          />
        </div>

        <div className="max-w-xl space-y-6 pt-8 sm:pt-28 sm:space-y-8">
          <p className="font-brand text-lg leading-relaxed text-paper sm:text-xl">
            Fatni Photography is the wider photographic archive of Ayoub El
            Fatni. Since 2017, I have photographed whatever made me stop:
            people, cities, landscapes, weather, architecture and the night
            sky.
          </p>
          <p className="font-brand text-base leading-relaxed text-paper-dim sm:text-lg">
            The archive brings together photographs made across different
            places, cameras and periods, without forcing them into a single
            project or style.
          </p>
          <p className="font-brand text-base leading-relaxed text-paper-dim sm:text-lg">
            My work has been shortlisted for the <AwardNames />.
          </p>
          <p className="!mt-12 font-brand text-base leading-relaxed text-fog sm:!mt-14 sm:text-lg">
            For focused work, visit{" "}
            <a href={AYOUB_PUBLIC_URL} className={sisterLinkClassName}>
              Ayoub El Fatni →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Ayoub: text-only, severe/minimal — no shared Fatni About content or portrait. */
function AyoubAbout() {
  return (
    <section className="bg-ink px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-4xl italic text-paper sm:text-5xl">
          About
        </h1>
        <div className="mt-10 space-y-6 sm:mt-12 sm:space-y-7">
          <p className="font-brand text-base leading-[1.75] text-paper/90 sm:text-[1.05rem]">
            Ayoub El Fatni is a London-based photographer working primarily with
            monochrome and low-light imagery.
          </p>
          <p className="font-brand text-base leading-[1.75] text-paper-dim sm:text-[1.05rem]">
            His photographs are drawn to unguarded states: people when they stop
            performing their public face, figures absorbed into architecture,
            and ordinary spaces transformed by darkness, geometry and
            artificial light.
          </p>
          <p className="font-brand text-base leading-[1.75] text-paper-dim sm:text-[1.05rem]">
            He began photographing in 2017. His work has been shortlisted for
            the <AwardNames />.
          </p>
          <p className="!mt-12 font-brand text-base leading-[1.75] text-fog sm:!mt-14 sm:text-[1.05rem]">
            For broader photographic work, visit{" "}
            <a href={FATNI_PUBLIC_URL} className={sisterLinkClassName}>
              Fatni Photography →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return isAyoubSite() ? <AyoubAbout /> : <FatniAbout />;
}
