import type { Metadata } from "next";
import { About } from "@/components/About";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getActiveSite, sitePageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: sitePageTitle("About"),
  description: getActiveSite().description,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <Header solid />
      <main className="min-h-svh pt-16 sm:pt-20">
        <About />
      </main>
      <Footer />
    </>
  );
}
