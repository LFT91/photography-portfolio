import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AfterDark } from "@/components/AfterDark";
import { Header } from "@/components/Header";
import { getCollectionPhotos } from "@/lib/photos";
import { publicPageMetadata } from "@/lib/seo";
import { isAyoubSite } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "After Dark",
  description:
    "After Dark brings together photographs made in those moments when reality seems to shift slightly out of register. Made over several years, the series follows that instability across different places, encounters and conditions.",
  path: "/projects/after-dark",
});

export const dynamic = "force-dynamic";

export default async function AyoubAfterDarkPage() {
  if (!isAyoubSite()) notFound();

  const items = await getCollectionPhotos("After Dark");

  return (
    <>
      <Header />
      <main>
        <AfterDark items={items} variant="ayoub" />
      </main>
    </>
  );
}
