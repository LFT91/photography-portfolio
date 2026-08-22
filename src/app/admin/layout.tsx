import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocalCuratorEnabled } from "@/lib/admin/guard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  if (!isLocalCuratorEnabled()) notFound();
  return children;
}
