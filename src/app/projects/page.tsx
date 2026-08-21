import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getCollectionPhotos } from "@/lib/catalog";
import { publicPageMetadata } from "@/lib/seo";
import { isAyoubSite } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = publicPageMetadata({
  title: "Projects",
  description: "Photographic projects by Ayoub El Fatni.",
  path: "/projects",
});

export default async function ProjectsPage() {
  if (!isAyoubSite()) notFound();

  const afterDark = await getCollectionPhotos("After Dark");
  const count = afterDark.length;

  return (
    <>
      <Header solid />
      <main id="main" className="min-h-svh pt-16 sm:pt-20">
        <section className="bg-ink px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
          <div className="mx-auto max-w-7xl">
            <h1 className="font-display text-4xl italic text-paper sm:text-5xl">
              Projects
            </h1>
            <p className="mt-4 max-w-lg font-brand text-base text-paper-dim sm:text-lg">
              Long-form photographic series.
            </p>

            <ul className="mt-16 max-w-2xl">
              <li className="border-t border-line">
                <Link
                  href="/projects/after-dark"
                  className="group flex items-baseline justify-between gap-6 py-8 transition-colors"
                >
                  <span className="font-display text-2xl italic text-paper transition-colors group-hover:text-ember sm:text-3xl">
                    After Dark
                  </span>
                  <span className="shrink-0 font-brand text-sm tracking-[0.08em] text-fog">
                    {count > 0 ? `${count} photographs` : "Coming soon"}
                  </span>
                </Link>
              </li>
              <li className="border-t border-line" aria-hidden />
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
