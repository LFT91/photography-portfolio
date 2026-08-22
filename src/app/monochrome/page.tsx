import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { Header } from "@/components/Header";
import { getCollectionPhotos } from "@/lib/photos";
import { publicPageMetadata } from "@/lib/seo";
import { isAyoubSite } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "Monochrome",
  description: "Monochrome photography by Ayoub El Fatni.",
  path: "/monochrome",
});

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
          presentation="ayoub"
        />
      </main>
      <Footer />
    </>
  );
}
