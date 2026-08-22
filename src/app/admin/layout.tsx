import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocalCuratorEnabled, isLoopbackHost } from "@/lib/admin/guard";
import "@/components/admin/curator.css";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!isLocalCuratorEnabled()) notFound();
  const host = (await headers()).get("host");
  if (!isLoopbackHost(host)) notFound();
  return children;
}
