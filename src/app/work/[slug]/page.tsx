import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionAdjacentNav } from "@/components/CollectionAdjacentNav";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { Header } from "@/components/Header";
import { fatniDefBySlug, FATNI_PUBLIC_COLLECTIONS } from "@/lib/fatni-collections";
import { getCollectionPhotos } from "@/lib/photos";
import { publicPageMetadata } from "@/lib/seo";
import { isAyoubSite, isFatniSite, sitePageTitle } from "@/lib/site";

export function generateStaticParams() {
  return FATNI_PUBLIC_COLLECTIONS.filter((collection) => !collection.special).map(
    (collection) => ({ slug: collection.slug }),
  );
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const def = fatniDefBySlug(slug);
  if (!def || def.special) {
    return { title: sitePageTitle("Collections") };
  }
  return publicPageMetadata({
    title: def.title,
    description: def.description,
    path: def.href,
  });
}

export default async function FatniCollectionPage({ params }: PageProps) {
  if (!isFatniSite() || isAyoubSite()) {
    notFound();
  }

  const { slug } = await params;

  if (slug === "after-dark") {
    notFound();
  }

  const def = fatniDefBySlug(slug);
  if (!def || def.special) {
    notFound();
  }

  const photos = await getCollectionPhotos(def.title);

  return (
    <>
      <Header solid />
      <main className="min-h-svh pt-16 sm:pt-20">
        <Gallery
          title={def.title}
          showFilters={false}
          lockedCategory={def.title}
          tightTop
          items={photos}
          presentation="default"
        />
        <CollectionAdjacentNav slug={def.slug} />
      </main>
      <Footer />
    </>
  );
}
