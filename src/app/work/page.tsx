import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CollectionIndex } from "@/components/CollectionIndex";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { FATNI_WORK_DESCRIPTION, publicPageMetadata } from "@/lib/seo";
import { getFatniCollectionSummaries } from "@/lib/photos";
import { isAyoubSite } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: isAyoubSite() ? "After Dark" : "Collections",
  description: isAyoubSite()
    ? "Photographs by Ayoub El Fatni."
    : FATNI_WORK_DESCRIPTION,
  path: "/work",
});

export const dynamic = "force-dynamic";

export default async function WorkPage() {
  if (isAyoubSite()) {
    // Selected Work was retired; send admins/bookmarks to the live project.
    redirect("/projects/after-dark");
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
