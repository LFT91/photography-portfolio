import photosJson from "./photos.json";

export type PhotoId = string;

export type PhotoRecord = {
  title: string;
  src: string;
  displayScale?: number;
};

/** Canonical photograph records. Machine-readable source: photos.json. */
export const photos = photosJson satisfies Record<string, PhotoRecord>;

export type CatalogPhotoId = keyof typeof photos;
