import type { Metadata } from "next";
import { CollectionManager } from "@/components/CollectionManager";

export const metadata: Metadata = {
  title: { absolute: "Collections | Admin | Fatni Photography" },
  robots: { index: false, follow: false },
};

export default function AdminCollectionsPage() {
  return (
    <main className="min-h-svh bg-ink pb-24">
      <CollectionManager />
    </main>
  );
}
