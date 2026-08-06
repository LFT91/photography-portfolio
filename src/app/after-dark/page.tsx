import type { Metadata } from "next";
import { AfterDark } from "@/components/AfterDark";
import { Header } from "@/components/Header";
import { afterDarkCover, afterDarkPhotos } from "@/data/photos";
import { getPhotos } from "@/lib/photos";

export const metadata: Metadata = {
  title: "After Dark | Fatni Photography",
  description:
    "After Dark series is a project showcasing the artist's vision of the world when day gives way to night.",
};

export const dynamic = "force-dynamic";

export default async function AfterDarkPage() {
  const photos = await getPhotos();
  const project = photos.filter((photo) =>
    photo.categories.includes("After Dark"),
  );
  const items = project.length ? project : afterDarkPhotos;
  const cover =
    items.find((photo) => photo.src.includes("after-dark-cover")) ??
    afterDarkCover;

  return (
    <>
      <Header />
      <main>
        <AfterDark items={items} cover={cover} />
      </main>
    </>
  );
}
