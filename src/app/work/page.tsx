import type { Metadata } from "next";
import { CollectionIndex } from "@/components/CollectionIndex";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { Header } from "@/components/Header";
import {
  getCollectionPhotos,
  getFatniCollectionSummaries,
} from "@/lib/photos";
import { isAyoubSite, sitePageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: sitePageTitle(isAyoubSite() ? "Selected Work" : "Collections"),
  description: isAyoubSite()
    ? "Selected Work by Ayoub El Fatni."
    : "Browse the Fatni Photography archive by collection.",
  alternates: { canonical: "/work" },
};

export const dynamic = "force-dynamic";

export default async function WorkPage() {
  if (isAyoubSite()) {
    const photos = await getCollectionPhotos("Selected Work");

    return (
      <>
        <Header solid />
        <main className="min-h-svh pt-16 sm:pt-20">
          <Gallery
            title="Selected Work"
            showFilters={false}
            lockedCategory="Selected Work"
            tightTop
            items={photos}
            presentation="ayoub"
          />
        </main>
        <Footer />
      </>
    );
  }

  const collections = await getFatniCollectionSummaries();

  return (
    <>
      <Header solid />
      <main className="min-h-svh pt-16 sm:pt-20">
        <CollectionIndex
          collections={collections}
          heading="Collections"
          intro="Landscape, cities, street, sky and monochrome."
        />
      </main>
      <Footer />
    </>
  );
}
