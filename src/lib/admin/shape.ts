import { collections, FATNI_COLLECTION_DEFS } from "@/content/collections";
import type { PhotoRecord } from "@/content/photos";
import type { PhotoCategory } from "@/lib/photo";
import type { CuratorCollection, CuratorPhoto } from "@/lib/admin/types";

export const CURATOR_COLLECTION_META: readonly {
  id: string;
  site: "fatni" | "ayoub";
  key: string;
  title: PhotoCategory;
}[] = [
  ...FATNI_COLLECTION_DEFS.map((def) => ({
    id: `fatni.${def.key}`,
    site: "fatni" as const,
    key: def.key,
    title: def.title,
  })),
  {
    id: "ayoub.afterDark",
    site: "ayoub",
    key: "afterDark",
    title: "After Dark",
  },
  {
    id: "ayoub.monochrome",
    site: "ayoub",
    key: "monochrome",
    title: "Monochrome",
  },
];

export const UPLOAD_FOLDER: Record<string, string> = {
  "fatni.nature": "nature",
  "fatni.urban": "urban",
  "fatni.astro": "astro",
  "fatni.street": "street",
  "fatni.monochrome": "monochrome",
  "ayoub.afterDark": "after-dark",
  "ayoub.monochrome": "monochrome",
};

export function photosToCurator(
  record: Record<string, PhotoRecord>,
): CuratorPhoto[] {
  return Object.entries(record).map(([id, photo]) => ({
    id,
    title: photo.title,
    src: photo.src,
    ...(photo.displayScale != null ? { displayScale: photo.displayScale } : {}),
  }));
}

export function photosFromCurator(
  photos: readonly CuratorPhoto[],
): Record<string, PhotoRecord> {
  const next: Record<string, PhotoRecord> = {};
  for (const photo of photos) {
    next[photo.id] = {
      title: photo.title,
      src: photo.src,
      ...(photo.displayScale != null && photo.displayScale !== 1
        ? { displayScale: photo.displayScale }
        : {}),
    };
  }
  return next;
}

export function collectionsToCurator(cols: {
  fatni: Record<string, readonly string[]>;
  ayoub: Record<string, readonly string[]>;
} = collections): CuratorCollection[] {
  return CURATOR_COLLECTION_META.map((meta) => {
    const ids =
      meta.site === "fatni"
        ? cols.fatni[meta.key as keyof typeof cols.fatni]
        : cols.ayoub[meta.key as keyof typeof cols.ayoub];
    return {
      ...meta,
      photoIds: [...ids],
    };
  });
}

export function collectionsFromCurator(list: readonly CuratorCollection[]): {
  fatni: Record<string, string[]>;
  ayoub: Record<string, string[]>;
} {
  const fatni: Record<string, string[]> = {
    nature: [],
    urban: [],
    astro: [],
    street: [],
    monochrome: [],
  };
  const ayoub: Record<string, string[]> = {
    afterDark: [],
    monochrome: [],
  };
  for (const collection of list) {
    if (collection.site === "fatni") {
      fatni[collection.key] = [...collection.photoIds];
    } else {
      ayoub[collection.key] = [...collection.photoIds];
    }
  }
  return { fatni, ayoub };
}
