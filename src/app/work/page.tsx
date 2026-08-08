import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { Header } from "@/components/Header";
import { getCollectionPhotos, getPhotos } from "@/lib/photos";
import { isAyoubSite, sitePageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: sitePageTitle(isAyoubSite() ? "Selected Work" : "Work"),
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

  const photos = await getPhotos();

  return (
    <>
      <Header solid />
      <main className="min-h-svh pt-16 sm:pt-20">
        <Gallery title="Gallery" tightTop items={photos} highlightAfterDark />
      </main>
      <Footer />
    </>
  );
}
