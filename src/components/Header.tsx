"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { getActiveSite, isAyoubSite } from "@/lib/site";

function linkIsActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true;
  return false;
}

export function Header({ solid = false }: { solid?: boolean }) {
  const site = getActiveSite();
  const links = site.nav;
  const showMark = !isAyoubSite();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const showBar = solid || scrolled || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    startTransition(() => setOpen(false));
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close mobile menu if viewport grows past the md breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[60] transition-colors duration-500 ${
          open
            ? "bg-ink"
            : showBar
              ? "bg-ink/80 backdrop-blur-md"
              : "bg-transparent"
        }`}
      >
        <div className="flex h-16 w-full items-center justify-between px-5 sm:h-20 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="relative z-[61] flex min-w-0 items-center gap-3 text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.65)]"
            onClick={() => setOpen(false)}
          >
            {showMark ? <BrandMark /> : null}
            <span className="truncate font-brand text-[1.35rem] font-medium tracking-[0.04em] sm:text-2xl">
              {site.name}
            </span>
          </Link>

          <nav className="hidden items-center gap-10 md:flex">
            {links.map((link) => {
              const active = linkIsActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-brand text-sm tracking-[0.12em] drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)] transition-colors ${
                    active
                      ? "text-white"
                      : "text-white/85 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="relative z-[61] flex h-10 w-10 shrink-0 items-center justify-center md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <span
              className={`absolute h-px w-6 bg-paper transition-transform duration-300 ${
                open ? "rotate-45" : "-translate-y-1.5"
              }`}
            />
            <span
              className={`absolute h-px w-6 bg-paper transition-opacity duration-300 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute h-px w-6 bg-paper transition-transform duration-300 ${
                open ? "-rotate-45" : "translate-y-1.5"
              }`}
            />
          </button>
        </div>
      </header>

      {/* Sibling of header — must not sit inside backdrop-filter (traps fixed) */}
      <div
        className={`fixed inset-0 z-[55] bg-ink transition-opacity duration-300 md:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      >
        <nav className="flex h-full flex-col items-center justify-center gap-6 px-6 pt-16 sm:gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 font-display text-3xl italic text-paper sm:text-4xl"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
