import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CollectionIndex } from "@/components/CollectionIndex";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getFatniCollectionSummaries } from "@/lib/catalog";
import { FATNI_WORK_DESCRIPTION, publicPageMetadata } from "@/lib/seo";
import { isAyoubSite } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: isAyoubSite() ? "After Dark" : "Collections",
  description: isAyoubSite()
    ? "Photographs by Ayoub El Fatni."
    : FATNI_WORK_DESCRIPTION,
  path: "/work",
});

export default function WorkPage() {
  if (isAyoubSite()) {
    redirect("/projects/after-dark");
  }

  const collections = getFatniCollectionSummaries();

  return (
    <>
      <Header solid />
      <main id="main" className="min-h-svh pt-16 sm:pt-20">
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
