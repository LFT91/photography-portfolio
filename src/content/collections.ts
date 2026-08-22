import type { CatalogPhotoId } from "@/content/photos";
import type { PhotoCategory } from "@/lib/photo";

export type FatniCollectionKey =
  | "nature"
  | "urban"
  | "astro"
  | "street"
  | "monochrome";

export type AyoubCollectionKey = "afterDark" | "monochrome";

export type FatniCollectionDef = {
  key: FatniCollectionKey;
  slug: string;
  title: PhotoCategory;
  href: string;
  description: string;
};

export const FATNI_COLLECTION_DEFS: readonly FatniCollectionDef[] = [
  {
    key: "nature",
    slug: "nature",
    title: "Nature",
    href: "/work/nature",
    description:
      "Nature photography by Ayoub El Fatni, from landscapes to quieter outdoor scenes.",
  },
  {
    key: "urban",
    slug: "urban",
    title: "Urban",
    href: "/work/urban",
    description:
      "Urban photography by Ayoub El Fatni, looking at cities, architecture and built space.",
  },
  {
    key: "astro",
    slug: "astro",
    title: "Astro",
    href: "/work/astro",
    description:
      "Astrophotography by Ayoub El Fatni, including night-sky and star-trail work.",
  },
  {
    key: "street",
    slug: "street",
    title: "Street",
    href: "/work/street",
    description:
      "Street photography by Ayoub El Fatni, made among people, movement and public space.",
  },
  {
    key: "monochrome",
    slug: "monochrome",
    title: "Monochrome",
    href: "/work/monochrome",
    description:
      "Monochrome photography by Ayoub El Fatni, in black and white.",
  },
];

export function fatniCollectionBySlug(
  slug: string,
): FatniCollectionDef | undefined {
  return FATNI_COLLECTION_DEFS.find((collection) => collection.slug === slug);
}

export function fatniAdjacent(
  slug: string,
): { prev: FatniCollectionDef | null; next: FatniCollectionDef | null } {
  const index = FATNI_COLLECTION_DEFS.findIndex(
    (collection) => collection.slug === slug,
  );
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? FATNI_COLLECTION_DEFS[index - 1]! : null,
    next:
      index < FATNI_COLLECTION_DEFS.length - 1
        ? FATNI_COLLECTION_DEFS[index + 1]!
        : null,
  };
}

/** Ordered photograph IDs for each public collection. */
export const collections = {
  fatni: {
    nature: [
      "aerial-view",
      "coastal-cove",
      "forest-divide",
      "kayaks-in-the-rock-pool",
      "mountain-village",
      "volcanic-peaks",
      "rift-above-the-sea",
      "glacier-watch",
      "alpine-church",
      "glacial-lagoon",
      "diamond-beach",
      "ice-shore",
      "the-lookout",
      "cave-of-two-waters",
      "valley-light",
      "message-on-the-shore",
      "crater-chain",
      "at-the-falls",
      "kirkjufell-falls",
      "veiled-valley",
      "pasture-rainbow",
      "winter-crossing",
      "white-peacock",
      "black-shore",
      "island-at-dusk",
      "afterimage-at-sunset",
      "island-outlook",
      "the-bridge-keeper",
      "two-in-the-mist",
      "boathouse-under-storm",
      "white-silence",
      "red-tuk-tuk-in-fog",
      "deer-herd",
      "refuge-below-the-peaks",
      "stags-clash",
    ] as const,
    urban: [
      "city-hall-curve",
      "shard-between-curves",
      "between-the-curves",
      "window-grid",
      "city-lights",
      "marina-viaduct",
      "oia-after-dark",
      "night-orbit",
      "illuminated-dome",
      "red-witness",
      "blue-domes",
      "quiet-hours",
      "fortnum-night",
      "moulin-rouge",
      "red-corner",
      "bus-reflection",
      "light-ring",
      "night-corner",
      "fog-brake-lights",
      "tower-bridge-dissolving",
      "fog-petrol",
      "underground-rush",
      "snow-street",
      "sun-through-tower-bridge",
      "arch-view",
      "fog-station-pass",
      "long-shadow",
      "city-hall-reflection",
      "at-the-monument",
      "westminster-cyclist",
      "at-the-threshold",
      "through-the-arch",
      "at-the-memorial",
      "aerial-panorama",
      "empty-platform",
      "street-mirror",
      "the-long-path",
      "hallgrimskirkja",
    ] as const,
    astro: [
      "aurora-boat",
      "comet-field",
      "milky-way-over-the-house",
      "aurora-watch",
      "aurora-cabin",
      "star-trails-path",
      "kirkjufell-aurora",
      "coastline-milky-way",
      "comet-tree",
      "milky-way-over-the-village",
      "window-under-the-stars",
      "tower-star-trails",
      "star-trails",
    ] as const,
    street: [
      "shared-umbrella",
      "between-the-doors",
      "after-leopoldstadt",
      "red-runner",
      "snow-walk",
      "walking-the-rain",
      "the-courier-and-the-mannequin",
      "white-socks",
      "cyclist-and-shadow",
      "union-jack-suit",
      "rain-edition",
      "bowler-hat",
      "under-the-arch",
      "a-kiss-on-bond-street",
      "table-for-two",
      "two-generations",
      "green-chef",
      "five-ronalds",
      "toward-happiness",
      "whisper",
      "remembrance",
      "the-cat-keeper",
      "quiet-reader",
      "delivery-rider",
      "lantern-wall",
      "orange-passenger",
      "headless",
      "peaky-blinder",
      "the-orb",
      "incognito",
      "brand-new-day",
      "double-up",
      "mount-olympus",
      "in-front-of-the-sale",
      "waiting-with-ronald",
      "late-cafe",
      "night-shift",
    ] as const,
    monochrome: [
      "before-the-great-door",
      "white-church-black-sky",
      "crossing-the-lines",
      "crossing-the-light",
      "white-corner",
      "first-table",
      "white-geometry",
      "into-the-light",
      "kuala-lumpur",
      "black-edge",
      "rue-drouin",
      "eleven-windows",
      "opposite-directions",
      "incomplete",
    ] as const,
  },
  ayoub: {
    afterDark: [
      "cyberpunk",
      "blue-oculus",
      "night-shift-after-dark",
      "last-bus",
      "around-the-corner",
      "red-light",
      "fog-street",
      "blue-poncho",
      "path-lights",
      "tower-bridge-fog",
      "rain-bus",
      "noodle-alley",
      "end-of-the-pier",
      "waiting-under-the-lamps",
      "threshold",
      "suffocating",
      "bond",
      "pizza-flip",
      "fogbound-traffic",
      "among-us",
      "in-the-woods",
      "blue",
      "still",
      "puddle-jump",
      "before-the-fire",
      "into-the-fog",
      "soho-kitchen",
      "rain-mosaic",
      "blade-runner-ii",
      "night-patrol",
    ] as const,
    monochrome: [
      "disc-facade",
      "concrete-curve",
      "four-shadows",
      "cyclist-in-light",
      "harrow-483",
      "stair-light",
      "light-beams",
      "one-poultry",
      "the-bright-end",
      "passing-the-wedge",
      "two-selves",
      "folded-passenger",
      "contortionist",
      "millipede-spiral",
      "spiral-stairs",
      "roof-rhythm",
      "under-the-word",
      "vanishing-passage",
      "blindfold-piano",
      "reflected-reader",
      "under-two-arches",
    ] as const,
  },
} as const;

export type CollectionPhotoId = (typeof collections)["fatni"][FatniCollectionKey][number] | (typeof collections)["ayoub"][AyoubCollectionKey][number];

export type { CatalogPhotoId };

