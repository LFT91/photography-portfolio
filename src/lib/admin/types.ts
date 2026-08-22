import type { PhotoRecord } from "@/content/photos";
import type { PhotoCategory } from "@/lib/photo";

export type CuratorSite = "fatni" | "ayoub";

export type CuratorPhoto = PhotoRecord & {
  id: string;
};

export type CuratorCollection = {
  id: string;
  site: CuratorSite;
  key: string;
  title: PhotoCategory;
  photoIds: string[];
};

export type CatalogDraft = {
  photos: CuratorPhoto[];
  collections: CuratorCollection[];
};
