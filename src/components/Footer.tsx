import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { getActiveSite, isAyoubSite } from "@/lib/site";

export function Footer() {
  const site = getActiveSite();
  const showMark = !isAyoubSite();

  return (
    <footer className="border-t border-line bg-ink px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 text-paper transition-colors hover:text-ember"
        >
          {showMark ? <BrandMark /> : null}
          <span className="font-brand text-base font-medium tracking-[0.04em]">
            {site.name}
          </span>
        </Link>
        <p className="text-sm text-fog sm:text-right">
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
