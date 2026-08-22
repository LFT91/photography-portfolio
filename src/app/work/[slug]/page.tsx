import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionAdjacentNav } from "@/components/CollectionAdjacentNav";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PhotoGrid } from "@/components/PhotoGrid";
import { fatniCollectionBySlug, FATNI_COLLECTION_DEFS } from "@/content/collections";
import { getCollectionPhotos } from "@/lib/catalog";
import { variantsFor } from "@/lib/image";
import { publicPageMetadata } from "@/lib/seo";
import { getPublicSiteUrl, isAyoubSite, isFatniSite, sitePageTitle } from "@/lib/site";

export function generateStaticParams() {
  return FATNI_COLLECTION_DEFS.map((collection) => ({
    slug: collection.slug,
  }));
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const def = fatniCollectionBySlug(slug);
  if (!def) {
    return { title: sitePageTitle("Collections") };
  }

  const photos = getCollectionPhotos(def.title);
  const cover = photos[0];
  const metadata = publicPageMetadata({
    title: def.title,
    description: def.description,
    path: def.href,
  });

  if (cover) {
    const image = variantsFor(cover.src).display;
    const origin = getPublicSiteUrl();
    metadata.openGraph = {
      ...metadata.openGraph,
      images: [
        {
          url: image.src.startsWith("http") ? image.src : `${origin}${image.src}`,
          width: image.width,
          height: image.height,
          alt: cover.title,
        },
      ],
    };
  }

  return metadata;
}

export default async function FatniCollectionPage({ params }: PageProps) {
  if (!isFatniSite() || isAyoubSite()) {
    notFound();
  }

  const { slug } = await params;
  const def = fatniCollectionBySlug(slug);
  if (!def) {
    notFound();
  }

  const photos = getCollectionPhotos(def.title);

  return (
    <>
      <Header solid />
      <main id="main" className="min-h-svh pt-16 sm:pt-20">
        <PhotoGrid title={def.title} tightTop items={photos} />
        <CollectionAdjacentNav slug={def.slug} />
      </main>
      <Footer />
    </>
  );
}
