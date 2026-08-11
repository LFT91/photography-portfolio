"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { Header } from "@/components/Header";
import { useAdmin } from "@/components/AdminProvider";
import type { Photo } from "@/data/photos";

/**
 * Admin-only Fatni workspace: the legacy filterable gallery for
 * upload / replace / delete / title / scale / reorder across rooms.
 * Public /work is now a collection index.
 */
export function AdminLibraryWorkspace({ items }: { items: Photo[] }) {
  const { ready, user } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/admin");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-ink">
        <p className="font-brand text-paper-dim">Checking session…</p>
      </main>
    );
  }

  return (
    <>
      <Header solid />
      <main className="min-h-svh pt-16 sm:pt-20">
        <Gallery
          title="Library"
          intro="Inline Fatni editing — upload, replace, delete, titles, display scale, and reorder. Collection membership is managed under Collections."
          tightTop
          items={items}
        />
      </main>
      <Footer />
    </>
  );
}
