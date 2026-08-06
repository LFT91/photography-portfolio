import type { Photo, PhotoCategory } from "@/data/photos";

export type DbPhoto = {
  id: string;
  title: string;
  storage_path: string;
  public_url: string;
  categories: string[];
  night_kind: string | null;
  sort_order: number;
  display_scale?: number | null;
};

export function mapDbPhoto(row: DbPhoto): Photo {
  return {
    id: row.id,
    src: row.public_url,
    title: row.title,
    categories: row.categories as PhotoCategory[],
    sortOrder: row.sort_order,
    storagePath: row.storage_path,
    displayScale: row.display_scale ?? 1,
  };
}
