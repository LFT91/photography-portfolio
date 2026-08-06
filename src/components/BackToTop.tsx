"use client";

import { useEffect, useState } from "react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-5 z-[45] border border-line bg-ink/80 px-3 py-2 font-brand text-sm tracking-[0.12em] text-paper-dim backdrop-blur-sm transition-all duration-300 hover:border-ember hover:text-ember sm:right-8 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
      style={{
        bottom: "max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))",
      }}
    >
      Top
      <span className="ml-1.5" aria-hidden>
        ↑
      </span>
    </button>
  );
}
