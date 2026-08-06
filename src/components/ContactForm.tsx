"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!name || !email || !message) {
      setStatus("error");
      return;
    }

    setStatus("sending");

    const subject = `Fatni Photography inquiry from ${name}`;
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const mailto = `mailto:photo.ae@pm.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    setStatus("sent");
    form.reset();
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-8">
      <label className="block">
        <span className="mb-2 block font-brand text-sm tracking-[0.08em] text-paper-dim">
          Name
        </span>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          className="w-full border-b border-line bg-transparent py-3 font-brand text-lg text-paper outline-none transition-colors placeholder:text-fog/50 focus:border-ember"
          placeholder="Your name"
        />
      </label>

      <label className="block">
        <span className="mb-2 block font-brand text-sm tracking-[0.08em] text-paper-dim">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border-b border-line bg-transparent py-3 font-brand text-lg text-paper outline-none transition-colors placeholder:text-fog/50 focus:border-ember"
          placeholder="you@email.com"
        />
      </label>

      <label className="block">
        <span className="mb-2 block font-brand text-sm tracking-[0.08em] text-paper-dim">
          Message
        </span>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full resize-y border-b border-line bg-transparent py-3 font-brand text-lg text-paper outline-none transition-colors placeholder:text-fog/50 focus:border-ember"
          placeholder="What can I help with?"
        />
      </label>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center gap-3 border border-paper/50 bg-paper/10 px-7 py-3.5 font-brand text-lg tracking-[0.06em] text-paper transition-colors hover:border-ember hover:bg-ember/15 hover:text-ember disabled:opacity-50"
        >
          Send message
          <span aria-hidden>→</span>
        </button>
        {status === "sent" ? (
          <p className="font-brand text-sm text-paper-dim">
            Opening your email app…
          </p>
        ) : null}
        {status === "error" ? (
          <p className="font-brand text-sm text-ember">
            Please fill in all fields.
          </p>
        ) : null}
      </div>
    </form>
  );
}
