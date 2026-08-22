import type { PhotoCategory } from "@/content/photos";

export type { PhotoCategory };

/**
 * Public gallery view of a photograph. Canonical metadata lives in
 * src/content/photos.ts; collection membership is in collections.ts.
 */
export type Photo = {
  id: string;
  src: string;
  title: string;
  categories: PhotoCategory[];
  sortOrder?: number;
  collectionOrders?: Partial<Record<PhotoCategory, number>>;
  displayScale?: number;
};

/**
 * Fatni Work gallery filters — After Dark is a separate Ayoub project;
 * Selected Work is retired.
 */
export const categories: PhotoCategory[] = [
  "Nature",
  "Urban",
  "Astro",
  "Street",
  "Monochrome",
];

export function photoInCategory(photo: Photo, category: PhotoCategory) {
  return photo.categories.includes(category);
}
