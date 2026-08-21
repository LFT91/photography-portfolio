import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const metadata: Metadata = {
  title: { absolute: "Admin | Fatni Photography" },
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main id="main" className="min-h-svh bg-ink">
      <AdminPanel />
    </main>
  );
}
