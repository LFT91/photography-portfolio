import type { Metadata } from "next";
import { About } from "@/components/About";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { sitePageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: sitePageTitle("About"),
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
