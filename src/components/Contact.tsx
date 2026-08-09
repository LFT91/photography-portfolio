import { isAyoubSite } from "@/lib/site";

export function Contact() {
  const artist = isAyoubSite();

  return (
    <section className="bg-ink px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <h1 className="max-w-xl font-display text-4xl italic text-paper sm:text-6xl">
          {artist ? "Contact" : "Get in touch"}
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-paper/85">
          {artist
            ? "For inquiries, email me."
            : "For inquiries, collaborations, or print requests, email me."}
        </p>
        <a
          href="mailto:photo.ae@pm.me"
          className="mt-8 inline-flex border-b border-paper/55 pb-1 font-brand text-base tracking-[0.04em] text-paper transition-colors hover:border-ember hover:text-ember sm:text-lg"
        >
          photo.ae@pm.me
        </a>
      </div>
    </section>
  );
}
