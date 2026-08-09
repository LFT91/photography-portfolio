"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!name || !email || !message) {
      setStatus("error");
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setStatus("sending");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(
          payload?.error || "Unable to send your message right now.",
        );
        return;
      }

      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage("Unable to send your message right now.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-8">
      <label className="block">
        <span className="mb-2 block font-brand text-sm tracking-[0.08em] text-paper/75">
          Name
        </span>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          className="w-full border-b border-line bg-transparent py-3 font-brand text-lg text-paper outline-none transition-colors placeholder:text-fog focus:border-ember"
          placeholder="Your name"
        />
      </label>

      <label className="block">
        <span className="mb-2 block font-brand text-sm tracking-[0.08em] text-paper/75">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border-b border-line bg-transparent py-3 font-brand text-lg text-paper outline-none transition-colors placeholder:text-fog focus:border-ember"
          placeholder="you@email.com"
        />
      </label>

      <label className="block">
        <span className="mb-2 block font-brand text-sm tracking-[0.08em] text-paper/75">
          Message
        </span>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full resize-y border-b border-line bg-transparent py-3 font-brand text-lg text-paper outline-none transition-colors placeholder:text-fog focus:border-ember"
          placeholder="What can I help with?"
        />
      </label>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center gap-3 border border-paper/65 bg-paper/12 px-7 py-3.5 font-brand text-lg tracking-[0.06em] text-paper transition-colors hover:border-ember hover:bg-ember/15 hover:text-ember disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send message"}
          <span aria-hidden>→</span>
        </button>
        {status === "sent" ? (
          <p className="font-brand text-sm text-paper/80">
            Thanks for contacting us. We&apos;ll get back to you soon.
          </p>
        ) : null}
        {status === "error" && errorMessage ? (
          <p className="font-brand text-sm text-ember">{errorMessage}</p>
        ) : null}
      </div>
    </form>
  );
}
