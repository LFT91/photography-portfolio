import type { Metadata } from "next";
import { Cormorant_Garamond, Instrument_Serif } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Fatni Photography",
  description:
    "London-based photographer Ayoub El Fatni — travel, street, and night photography. Shortlisted in the British Photography Awards and Monochrome Photography Awards.",
  openGraph: {
    title: "Fatni Photography",
    description:
      "London-based photographer Ayoub El Fatni — travel, street, and night photography.",
    type: "website",
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
        {children}
      </body>
    </html>
  );
}
