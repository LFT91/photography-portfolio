import { ContactForm } from "@/components/ContactForm";

export function Contact() {
  return (
    <section className="bg-ink px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:gap-24">
        <div>
          <h1 className="max-w-xl font-display text-4xl italic text-paper sm:text-6xl">
            Get in touch
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-paper-dim">
            For inquiries, collaborations, or print requests, email me or use
            the form.
          </p>
          <a
            href="mailto:photo.ae@pm.me"
            className="mt-8 inline-flex border-b border-paper/40 pb-1 font-brand text-base tracking-[0.04em] text-paper transition-colors hover:border-ember hover:text-ember sm:text-lg"
          >
            photo.ae@pm.me
          </a>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
