import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AfterDark } from "@/components/AfterDark";
import { Header } from "@/components/Header";
import { getCollectionPhotos } from "@/lib/photos";
import { isAyoubSite, sitePageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: sitePageTitle("After Dark"),
  description:
    "After Dark — a photographic project by Ayoub El Fatni on the world after nightfall.",
};

export const dynamic = "force-dynamic";

export default async function AyoubAfterDarkPage() {
  if (!isAyoubSite()) notFound();

  const items = await getCollectionPhotos("After Dark");
  const cover =
    items.find((photo) => photo.title.trim() === "Night Train") ??
    items[0] ??
    null;

  return (
    <>
      <Header />
      <main>
        <AfterDark items={items} cover={cover} variant="ayoub" />
      </main>
    </>
  );
}
