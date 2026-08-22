"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main"
      className="flex min-h-svh flex-col items-center justify-center bg-ink px-5 text-center"
    >
      <h1 className="font-display text-4xl italic text-paper sm:text-5xl">
        Something went wrong
      </h1>
      <p className="mt-5 max-w-md font-brand text-paper-dim">
        Please try again in a moment.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-10 border border-line px-4 py-2 font-brand text-sm tracking-[0.08em] text-paper-dim transition-colors hover:text-paper"
      >
        Retry
      </button>
    </main>
  );
}
