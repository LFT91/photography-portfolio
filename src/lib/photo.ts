export type PhotoCategory =
  | "Nature"
  | "Urban"
  | "Astro"
  | "Street"
  | "Monochrome"
  | "After Dark";

export type Photo = {
  id: string;
  src: string;
  title: string;
  categories: PhotoCategory[];
  displayScale?: number;
};
