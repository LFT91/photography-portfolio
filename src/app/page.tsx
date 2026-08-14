import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import type { Photo } from "@/data/photos";
import { fatniHomeJsonLd, FATNI_HOME_DESCRIPTION, FATNI_HOME_TITLE, publicPageMetadata } from "@/lib/seo";
import { isAyoubSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = isAyoubSite()
  ? { alternates: { canonical: "/" } }
  : publicPageMetadata({
      title: "Ayoub El Fatni Photography",
      description: FATNI_HOME_DESCRIPTION,
      path: "/",
      absoluteTitle: FATNI_HOME_TITLE,
    });

/** Approved Ayoub homepage façade (local asset; not from Supabase membership). */
const AYOUB_HOMEPAGE_COVER: Photo = {
  src: "/images/ayoub-homepage-test.png",
  title: "Façade",
  categories: ["After Dark"],
};

/** Fatni: Star Trails entrance only. Ayoub: façade + ENTER. */
export default async function Home() {
  const ayoubCover = isAyoubSite() ? AYOUB_HOMEPAGE_COVER : null;

  return (
    <div className="h-svh overflow-hidden">
      {isAyoubSite() ? null : <JsonLd data={fatniHomeJsonLd()} />}
      <Header />
      <main>
        <Hero ayoubCover={ayoubCover} />
      </main>
    </div>
  );
}
