import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminProvider } from "@/components/admin/AdminProvider";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminProvider>
      <AdminNav />
      {children}
    </AdminProvider>
  );
}
