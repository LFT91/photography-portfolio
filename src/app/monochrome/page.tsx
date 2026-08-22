import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PhotoGrid } from "@/components/PhotoGrid";
import { getCollectionPhotos } from "@/lib/catalog";
import { publicPageMetadata } from "@/lib/seo";
import { isAyoubSite } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "Monochrome",
  description: "Monochrome photography by Ayoub El Fatni.",
  path: "/monochrome",
});

export default function MonochromePage() {
  if (!isAyoubSite()) notFound();

  return (
    <>
      <Header solid />
      <main id="main" className="min-h-svh pt-16 sm:pt-20">
        <PhotoGrid
          title="Monochrome"
          tightTop
          items={getCollectionPhotos("Monochrome")}
          layout="ayoub"
        />
      </main>
      <Footer />
    </>
  );
}
