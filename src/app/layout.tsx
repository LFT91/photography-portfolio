import type { Metadata } from "next";
import { Cormorant_Garamond, Instrument_Serif } from "next/font/google";
import { AdminProvider } from "@/components/AdminProvider";
import { BackToTop } from "@/components/BackToTop";
import { SiteAdminBar } from "@/components/SiteAdminBar";
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://fatni-photography.vercel.app";

const siteDescription =
  "London-based photographer Ayoub El Fatni — travel, street, and night photography. Shortlisted in the British Photography Awards and Monochrome Photography Awards.";

const ogDescription =
  "London-based photographer Ayoub El Fatni — travel, street, and night photography.";

const shareImage = {
  url: "/images/startrails.jpg",
  width: 1920,
  height: 1280,
  alt: "Star trails over a mountain landscape",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Fatni Photography",
  description: siteDescription,
  openGraph: {
    title: "Fatni Photography",
    description: ogDescription,
    type: "website",
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fatni Photography",
    description: ogDescription,
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
