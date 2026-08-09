import { CollectionIndex } from "@/components/CollectionIndex";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import type { Photo } from "@/data/photos";
import { getFatniCollectionSummaries } from "@/lib/photos";
import { isAyoubSite } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Approved Ayoub homepage façade (local asset; not from Supabase membership). */
const AYOUB_HOMEPAGE_COVER: Photo = {
  src: "/images/ayoub-homepage-test.png",
  title: "Façade",
  categories: ["After Dark"],
};

export default async function Home() {
  if (isAyoubSite()) {
    return (
      <div className="h-svh overflow-hidden">
        <Header />
        <main>
          <Hero ayoubCover={AYOUB_HOMEPAGE_COVER} />
        </main>
      </div>
    );
  }

  const collections = await getFatniCollectionSummaries();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <CollectionIndex
          collections={collections}
          heading="Collections"
          intro="A growing archive of landscapes, travel, cities, street, and night — organised for wandering."
          preview
        />
      </main>
      <Footer />
    </>
  );
}
