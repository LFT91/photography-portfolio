import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminLibraryWorkspace } from "@/components/AdminLibraryWorkspace";
import { getPhotos } from "@/lib/photos";
import { isFatniSite } from "@/lib/site";

export const metadata: Metadata = {
  title: "Library | Admin | Fatni Photography",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Fatni-only admin library — preserves the legacy inline Gallery editor
 * after public /work became a collection index.
 */
export default async function AdminLibraryPage() {
  if (!isFatniSite()) {
    notFound();
  }

  const photos = await getPhotos();
  return <AdminLibraryWorkspace items={photos} />;
}
