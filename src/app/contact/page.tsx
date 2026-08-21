import type { Metadata } from "next";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { FATNI_CONTACT_DESCRIPTION, publicPageMetadata } from "@/lib/seo";
import { getActiveSite, isAyoubSite } from "@/lib/site";

const site = getActiveSite();

export const metadata: Metadata = publicPageMetadata({
  title: "Contact",
  description: isAyoubSite()
    ? `Get in touch with ${site.name}.`
    : FATNI_CONTACT_DESCRIPTION,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <Header solid />
      <main id="main" className="min-h-svh pt-16 sm:pt-20">
        <Contact />
      </main>
      <Footer />
    </>
  );
}
