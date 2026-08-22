import Link from "next/link";
import { getActiveSite } from "@/lib/site";

export default function NotFound() {
  const site = getActiveSite();

  return (
    <main id="main" className="flex min-h-svh flex-col items-center justify-center bg-ink px-5 text-center">
      <p className="font-display text-4xl italic text-paper sm:text-5xl">
        Page not found
      </p>
      <Link
        href="/"
        className="mt-10 font-brand text-sm tracking-[0.14em] text-paper-dim transition-colors hover:text-paper"
      >
        {site.name}
      </Link>
    </main>
  );
}
