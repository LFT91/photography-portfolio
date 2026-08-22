import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Instrument_Serif } from "next/font/google";
import { BackToTop } from "@/components/BackToTop";
import {
  FATNI_HOME_DESCRIPTION,
  FATNI_HOME_TITLE,
  SHARE_IMAGE,
  indexingRobots,
} from "@/lib/seo";
import {
  FATNI_PUBLIC_URL,
  PHOTOGRAPHER_NAME,
  getActiveSite,
  getPublicSiteUrl,
  isAyoubSite,
} from "@/lib/site";
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
const brandingMetadata: Metadata = {
  applicationName: site.name,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/apple-touch-icon-precomposed.png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: site.name,
    statusBarStyle: "black-translucent",
  },
};

const ayoubMetadata: Metadata = {
  ...brandingMetadata,
  metadataBase: new URL(siteUrl),
  title: site.name,
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.ogDescription,
    type: "website",
    siteName: site.name,
    url: siteUrl,
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.ogDescription,
    images: [SHARE_IMAGE.url],
  },
};

const fatniMetadata: Metadata = {
  ...brandingMetadata,
  metadataBase: new URL(FATNI_PUBLIC_URL),
  title: {
    default: FATNI_HOME_TITLE,
    template: "%s | Fatni Photography",
  },
  description: FATNI_HOME_DESCRIPTION,
  authors: [{ name: PHOTOGRAPHER_NAME, url: `${FATNI_PUBLIC_URL}/about` }],
  creator: PHOTOGRAPHER_NAME,
  publisher: site.name,
  robots: indexingRobots(),
  openGraph: {
    title: FATNI_HOME_TITLE,
    description: FATNI_HOME_DESCRIPTION,
    type: "website",
    siteName: site.name,
    locale: "en",
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: FATNI_HOME_TITLE,
    description: FATNI_HOME_DESCRIPTION,
    images: [SHARE_IMAGE.url],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0c0e",
};

export const metadata: Metadata = isAyoubSite() ? ayoubMetadata : fatniMetadata;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${brand.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ink font-brand text-paper">
        <div className="grain" aria-hidden />
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
