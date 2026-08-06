import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 text-paper transition-colors hover:text-ember"
        >
          <BrandMark />
          <span className="font-brand text-base font-medium tracking-[0.04em]">
            Fatni Photography
          </span>
        </Link>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-sm text-fog">
            © {new Date().getFullYear()} Fatni Photography. All rights reserved.
          </p>
          <Link
            href="/admin"
            className="font-brand text-[11px] tracking-[0.06em] text-fog/45 transition-colors hover:text-fog/80"
          >
            admin access
          </Link>
        </div>
      </div>
    </footer>
  );
}
