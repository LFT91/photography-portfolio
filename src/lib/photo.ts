export type PhotoCategory =
  | "Nature"
  | "Urban"
  | "Astro"
  | "Street"
  | "Monochrome"
  | "After Dark"
  | "Selected Work";

export const PHOTO_CATEGORIES: readonly PhotoCategory[] = [
  "Nature",
  "Urban",
  "Astro",
  "Street",
  "Monochrome",
  "After Dark",
  "Selected Work",
] as const;

/** Fatni Work gallery rooms — After Dark is Ayoub-only. */
export const FATNI_GALLERY_CATEGORIES: PhotoCategory[] = [
  "Nature",
  "Urban",
  "Astro",
  "Street",
  "Monochrome",
];

export type Photo = {
  id?: string;
  src: string;
  title: string;
  categories: PhotoCategory[];
  sortOrder?: number;
  collectionOrders?: Partial<Record<PhotoCategory, number>>;
  storagePath?: string;
  /** Gallery tile width relative to column (1 = full). Keeps aspect ratio. */
  displayScale?: number;
};

export function isPhotoCategory(value: string): value is PhotoCategory {
  return (PHOTO_CATEGORIES as readonly string[]).includes(value);
}

export function photoInCategory(photo: Photo, category: PhotoCategory) {
  return photo.categories.includes(category);
}
