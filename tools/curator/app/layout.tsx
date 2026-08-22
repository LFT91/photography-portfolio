import type { ReactNode } from "react";
import "@/components/admin/curator.css";

export const metadata = {
  title: { absolute: "Photography Curator" },
  robots: { index: false, follow: false },
};

export default function CuratorRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
