import { ProtectedImage } from "@/components/ProtectedImage";

export function About() {
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

        <div className="max-w-xl space-y-8 pt-8 sm:pt-28">
          <p className="font-display text-2xl italic leading-snug text-paper sm:text-3xl">
            Ayoub El Fatni
          </p>
          <p className="font-brand text-lg leading-relaxed text-paper sm:text-xl">
            London-based photographer passionate about travel, street, and night
            photography.
          </p>
          <p className="border-l border-ember/60 pl-5 text-base leading-relaxed text-paper-dim sm:text-lg">
            Shortlisted multiple times in prestigious national and international
            photography competitions such as the{" "}
            <span className="font-medium text-paper underline decoration-ember/70 decoration-1 underline-offset-4">
              British Photography Awards (BPA)
            </span>{" "}
            and the{" "}
            <span className="font-medium text-paper underline decoration-ember/70 decoration-1 underline-offset-4">
              Monochrome Photography Awards
            </span>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
