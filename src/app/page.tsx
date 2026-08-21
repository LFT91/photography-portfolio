import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import {
  FATNI_HOME_DESCRIPTION,
  FATNI_HOME_TITLE,
  fatniHomeJsonLd,
  publicPageMetadata,
} from "@/lib/seo";
import { isAyoubSite } from "@/lib/site";

export const metadata: Metadata = isAyoubSite()
  ? publicPageMetadata({
      title: "Ayoub El Fatni",
      description: "Photographs by Ayoub El Fatni.",
      path: "/",
    })
  : publicPageMetadata({
      title: "Ayoub El Fatni Photography",
      description: FATNI_HOME_DESCRIPTION,
      path: "/",
      absoluteTitle: FATNI_HOME_TITLE,
    });

export default function Home() {
  return (
    <div className="h-svh overflow-hidden">
      {isAyoubSite() ? null : <JsonLd data={fatniHomeJsonLd()} />}
      <Header />
      <main id="main">
        <Hero />
      </main>
    </div>
  );
}
