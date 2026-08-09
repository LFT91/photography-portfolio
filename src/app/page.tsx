import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import type { Photo } from "@/data/photos";
import { isAyoubSite } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Approved Ayoub homepage façade (local asset; not from Supabase membership). */
const AYOUB_HOMEPAGE_COVER: Photo = {
  src: "/images/ayoub-homepage-test.png",
  title: "Façade",
  categories: ["After Dark"],
};

/** Fatni: Star Trails entrance only. Ayoub: façade + ENTER. */
export default async function Home() {
  const ayoubCover = isAyoubSite() ? AYOUB_HOMEPAGE_COVER : null;

  return (
    <div className="h-svh overflow-hidden">
      <Header />
      <main>
        <Hero ayoubCover={ayoubCover} />
      </main>
    </div>
  );
}
