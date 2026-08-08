import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { Header } from "@/components/Header";
import { getCollectionPhotos } from "@/lib/photos";
import { isAyoubSite, sitePageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: sitePageTitle("Monochrome"),
};

export const dynamic = "force-dynamic";

export default async function MonochromePage() {
  if (!isAyoubSite()) notFound();

  const photos = await getCollectionPhotos("Monochrome");

  return (
    <>
      <Header solid />
      <main className="min-h-svh pt-16 sm:pt-20">
        <Gallery
          title="Monochrome"
          showFilters={false}
          lockedCategory="Monochrome"
          tightTop
          items={photos}
        />
      </main>
      <Footer />
    </>
  );
}
