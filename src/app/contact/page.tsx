import type { Metadata } from "next";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getActiveSite, sitePageTitle } from "@/lib/site";

const site = getActiveSite();

export const metadata: Metadata = {
  title: sitePageTitle("Contact"),
  description: `Get in touch with ${site.name}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <Header solid />
      <main className="min-h-svh pt-16 sm:pt-20">
        <Contact />
      </main>
      <Footer />
    </>
  );
}
