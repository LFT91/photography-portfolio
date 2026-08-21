import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminLibraryWorkspace } from "@/components/admin/AdminLibraryWorkspace";
import { getLibraryPhotos } from "@/lib/catalog";
import { isFatniSite } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Library | Admin | Fatni Photography" },
  robots: { index: false, follow: false },
};

export default async function AdminLibraryPage() {
  if (!isFatniSite()) {
    notFound();
  }

  const photos = await getLibraryPhotos();
  return <AdminLibraryWorkspace items={photos} />;
}
