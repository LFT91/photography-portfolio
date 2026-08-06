import type { NightKind, Photo, PhotoCategory } from "@/data/photos";

export type DbPhoto = {
  id: string;
  title: string;
  storage_path: string;
  public_url: string;
  categories: string[];
  night_kind: NightKind | null;
  sort_order: number;
};

export function mapDbPhoto(row: DbPhoto): Photo {
  return {
    id: row.id,
    src: row.public_url,
    title: row.title,
    categories: row.categories as PhotoCategory[],
    nightKind: row.night_kind ?? undefined,
    sortOrder: row.sort_order,
    storagePath: row.storage_path,
  };
}
