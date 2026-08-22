import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CuratorApp } from "@/components/admin/CuratorApp";
import { unassignedIds } from "@/lib/admin/draft";
import { isLocalCuratorEnabled } from "@/lib/admin/guard";
import { getMastersStatus } from "@/lib/admin/masters";
import { collectionsToCurator, photosToCurator } from "@/lib/admin/shape";
import { collections } from "@/content/collections";
import { photos } from "@/content/photos";

export const metadata: Metadata = {
  title: { absolute: "Photography Curator" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  if (!isLocalCuratorEnabled()) notFound();
  const curatorPhotos = photosToCurator(photos);
  const curatorCollections = collectionsToCurator(collections);
  const masters = getMastersStatus();
  return (
    <CuratorApp
      initial={{
        photos: curatorPhotos,
        collections: curatorCollections,
        unassignedIds: unassignedIds(curatorPhotos, curatorCollections),
        canUpload: masters.ok,
        uploadDisabledReason: masters.ok ? null : masters.reason,
      }}
    />
  );
}
