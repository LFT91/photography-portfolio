import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { collections } from "@/content/collections";
import { photos } from "@/content/photos";
import { sites } from "@/content/sites";
import { CuratorApp } from "@/components/admin/CuratorApp";
import { unassignedIds } from "@/lib/admin/draft";
import { isLocalCuratorEnabled } from "@/lib/admin/guard";
import { getMastersStatus } from "@/lib/admin/masters";

export const metadata: Metadata = {
  title: { absolute: "Local curator" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  if (!isLocalCuratorEnabled()) notFound();
  const masters = getMastersStatus();
  return (
    <CuratorApp
      initial={{
        photos,
        collections,
        sites,
        unassignedIds: unassignedIds(photos, collections),
        canUpload: masters.ok,
        uploadDisabledReason: masters.ok ? null : masters.reason,
      }}
    />
  );
}
