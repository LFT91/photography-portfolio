import type { Metadata } from "next";
import { Cormorant_Garamond, Instrument_Serif } from "next/font/google";
import { AdminProvider } from "@/components/AdminProvider";
import { BackToTop } from "@/components/BackToTop";
import { SiteAdminBar } from "@/components/SiteAdminBar";
import { getActiveSite, getPublicSiteUrl } from "@/lib/site";
import "./globals.css";

const brand = Cormorant_Garamond({
  variable: "--font-brand-family",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const display = Instrument_Serif({
  variable: "--font-display-family",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const site = getActiveSite();
const siteUrl = getPublicSiteUrl();

const shareImage = {
  url: "/images/startrails.jpg",
  width: 1920,
  height: 1280,
  alt: "Star trails over a mountain landscape",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: site.name,
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.ogDescription,
    type: "website",
    siteName: site.name,
    url: siteUrl,
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.ogDescription,
    images: [shareImage.url],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${brand.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ink font-brand text-paper">
        <div className="grain" aria-hidden />
        <AdminProvider>
          {children}
          <SiteAdminBar />
          <BackToTop />
        </AdminProvider>
      </body>
    </html>
  );
}
