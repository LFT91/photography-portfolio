export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex h-11 w-11 shrink-0 sm:h-12 sm:w-12 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local emblem; skip optimizer */}
      <img
        src="/fp-emblem.png"
        alt=""
        width={96}
        height={96}
        className="h-full w-full object-contain mix-blend-screen"
        decoding="async"
        fetchPriority="high"
      />
    </span>
  );
}
