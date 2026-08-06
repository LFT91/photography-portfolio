import type { Metadata } from "next";
import { AfterDark } from "@/components/AfterDark";
import { Header } from "@/components/Header";
import { afterDarkCover } from "@/data/photos";
import { getPhotos } from "@/lib/photos";

export const metadata: Metadata = {
  title: "After Dark | Fatni Photography",
  description:
    "The quiet hours of night — nightscapes, starscapes, and streets after dark.",
};

export const dynamic = "force-dynamic";

export default async function AfterDarkPage() {
  const photos = await getPhotos();
  const cover =
    photos.find((photo) => photo.src.includes("after-dark-cover")) ??
    photos.find((photo) => photo.categories.includes("Night")) ??
    afterDarkCover;

  return (
    <>
      <Header />
      <main>
        <AfterDark items={photos} cover={cover} />
      </main>
    </>
  );
}
