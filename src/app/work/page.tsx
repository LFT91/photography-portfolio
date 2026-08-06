import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { Header } from "@/components/Header";
import { getPhotos } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Work | Fatni Photography",
};

export const dynamic = "force-dynamic";

export default async function WorkPage() {
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
