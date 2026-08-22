import type { Metadata } from "next";
import { About } from "@/components/About";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import {
  FATNI_ABOUT_DESCRIPTION,
  FATNI_ABOUT_TITLE,
  fatniPersonJsonLd,
  publicPageMetadata,
} from "@/lib/seo";
import { getActiveSite, isAyoubSite } from "@/lib/site";

export const metadata: Metadata = isAyoubSite()
  ? publicPageMetadata({
      title: "About",
      description: getActiveSite().description,
      path: "/about",
    })
  : publicPageMetadata({
      title: "About",
      description: FATNI_ABOUT_DESCRIPTION,
      path: "/about",
      absoluteTitle: FATNI_ABOUT_TITLE,
    });

export default function AboutPage() {
  return (
    <>
      {isAyoubSite() ? null : <JsonLd data={fatniPersonJsonLd()} />}
      <Header solid />
      <main id="main" className="min-h-svh pt-16 sm:pt-20">
        <About />
      </main>
      <Footer />
    </>
  );
}
