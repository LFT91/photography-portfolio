export type PhotoCategory =
  | "Nature"
  | "Urban"
  | "Astro"
  | "Street"
  | "Monochrome"
  | "After Dark";

export type Photo = {
  id?: string;
  src: string;
  title: string;
  categories: PhotoCategory[];
  sortOrder?: number;
  storagePath?: string;
};

/** Work gallery filters — After Dark is a separate project. */
export const categories: PhotoCategory[] = [
  "Nature",
  "Urban",
  "Astro",
  "Street",
  "Monochrome",
];

export const photos: Photo[] = [
  {
    src: "/images/DJI_0464-HDR-Pano-Edit.jpg",
    title: "Aerial Panorama",
    categories: ["Urban"],
    sortOrder: 0,
  },
  {
    src: "/images/DJI_0117-HDR-Edit.jpg",
    title: "Aerial View",
    categories: ["Nature"],
    sortOrder: 1,
  },
  {
    src: "/images/coastal-cove.jpg",
    title: "Coastal Cove",
    categories: ["Nature"],
    sortOrder: 3,
  },
  {
    src: "/images/trees.jpeg",
    title: "Trees",
    categories: ["Nature"],
    sortOrder: 4,
  },
  {
    src: "/images/A7303942-Edit2.jpg",
    title: "Valley Light",
    categories: ["Nature"],
    sortOrder: 5,
  },
  {
    src: "/images/after-dark/1322EAC0-7E67-47C5-8FC4-6A8D285E561C.jpg",
    title: "Coastal Moon",
    categories: ["Nature"],
    sortOrder: 6,
  },
  {
    src: "/images/after-dark/5F0A7A9B-056C-4494-A5B2-9670B3596602.jpg",
    title: "Arch View",
    categories: ["Nature"],
    sortOrder: 7,
  },
  {
    src: "/images/after-dark/7E7A53E3-49A2-4BAA-8967-255434470242.jpg",
    title: "Sea Stacks",
    categories: ["Nature"],
    sortOrder: 9,
  },
  {
    src: "/images/after-dark/DABA4D9F-F725-4871-ADF1-33567E2253C0.jpg",
    title: "Ice Shore",
    categories: ["Nature"],
    sortOrder: 11,
  },
  {
    src: "/images/after-dark/IMG_5539-1.jpg",
    title: "Hillside Lights",
    categories: ["Nature"],
    sortOrder: 12,
  },
  {
    src: "/images/travel/alpine-church.jpg",
    title: "Alpine Church",
    categories: ["Nature"],
    sortOrder: 13,
  },
  {
    src: "/images/travel/mountain-village.jpg",
    title: "Mountain Village",
    categories: ["Nature"],
    sortOrder: 14,
  },
  {
    src: "/images/travel/palm-beach.jpg",
    title: "Palm Beach",
    categories: ["Nature"],
    sortOrder: 15,
  },
  {
    src: "/images/travel/sunset-shore.jpg",
    title: "Sunset Shore",
    categories: ["Nature"],
    sortOrder: 16,
  },
  {
    src: "/images/travel/turquoise-coast.jpg",
    title: "Turquoise Coast",
    categories: ["Nature"],
    sortOrder: 17,
  },
  {
    src: "/images/travel/island-outlook.jpg",
    title: "Island Outlook",
    categories: ["Nature"],
    sortOrder: 18,
  },
  {
    src: "/images/travel/glacial-lagoon.jpg",
    title: "Glacial Lagoon",
    categories: ["Nature"],
    sortOrder: 19,
  },
  {
    src: "/images/travel/diamond-beach.jpg",
    title: "Diamond Beach",
    categories: ["Nature"],
    sortOrder: 20,
  },
  {
    src: "/images/nature/stag-portrait.jpg",
    title: "Stag Portrait",
    categories: ["Nature"],
    sortOrder: 21,
  },
  {
    src: "/images/nature/stags-clash.jpg",
    title: "Stags Clash",
    categories: ["Nature"],
    sortOrder: 22,
  },
  {
    src: "/images/nature/deer-herd.jpg",
    title: "Deer Herd",
    categories: ["Nature"],
    sortOrder: 23,
  },
  {
    src: "/images/image_6483441.JPG",
    title: "Architecture",
    categories: ["Urban"],
    sortOrder: 24,
  },
  {
    src: "/images/after-dark/0A9E1A4A-F5FB-4365-B12F-5BE1190395EB.jpg",
    title: "Night Marina",
    categories: ["Urban"],
    sortOrder: 25,
  },
  {
    src: "/images/after-dark/12093E8F-8DE7-4233-96E1-28D8270D0C25.jpg",
    title: "Light Ring",
    categories: ["Urban"],
    sortOrder: 26,
  },
  {
    src: "/images/after-dark/78F56291-F28E-42FD-9CDC-C4C33CF10530.jpg",
    title: "Blue Domes",
    categories: ["Urban"],
    sortOrder: 27,
  },
  {
    src: "/images/after-dark/A7302924.jpg",
    title: "City Lights",
    categories: ["Urban"],
    sortOrder: 29,
  },
  {
    src: "/images/after-dark/D28062C8-D542-4F6F-995E-DAD7790A7EC0.jpg",
    title: "Hallgrimskirkja",
    categories: ["Urban"],
    sortOrder: 30,
  },
  {
    src: "/images/after-dark/window-grid.jpg",
    title: "Window Grid",
    categories: ["Urban"],
    sortOrder: 32,
  },
  {
    src: "/images/image_6483441-2.JPG",
    title: "Northern Lights",
    categories: ["Astro"],
    sortOrder: 33,
  },
  {
    src: "/images/after-dark/26CDFA76-BFEA-4266-93DC-7A4BA3512337.jpg",
    title: "Star Trails Path",
    categories: ["Astro"],
    sortOrder: 35,
  },
  {
    src: "/images/after-dark/650CD8F4-159E-4E17-BF66-985E8DD1F47E.jpg",
    title: "Star Road",
    categories: ["After Dark"],
    sortOrder: 36,
  },
  {
    src: "/images/after-dark/A7308148-2.jpg",
    title: "Comet Field",
    categories: ["Astro"],
    sortOrder: 37,
  },
  {
    src: "/images/after-dark/C884E0B9-73BF-4C3B-AD2A-87F66FA575E1.jpg",
    title: "Aurora Watch",
    categories: ["Astro"],
    sortOrder: 38,
  },
  {
    src: "/images/after-dark/DD5ECB7C-5ACC-455F-B574-0B1976D659C4.jpg",
    title: "Aurora Cabin",
    categories: ["Astro"],
    sortOrder: 39,
  },
  {
    src: "/images/after-dark/DECBAFBD-1653-43A6-80AE-E599A9E65066.jpg",
    title: "Aurora Boat",
    categories: ["Astro"],
    sortOrder: 40,
  },
  {
    src: "/images/after-dark/DFB08D78-D13D-40B9-9154-898FBA4A7EEF.jpg",
    title: "Comet Tree",
    categories: ["Astro"],
    sortOrder: 41,
  },
  {
    src: "/images/after-dark/E9823C88-C5A1-4102-B95E-13F2DD3F8371.jpg",
    title: "Aurora Lake",
    categories: ["Astro"],
    sortOrder: 42,
  },
  {
    src: "/images/after-dark/_A736530-2-DeNoiseAI-severe-noise.jpg",
    title: "Kirkjufell Aurora",
    categories: ["Astro"],
    sortOrder: 43,
  },
  {
    src: "/images/after-dark/startrails.jpg",
    title: "Star Trails",
    categories: ["Astro"],
    sortOrder: 44,
  },
  {
    src: "/images/after-dark/FIRE50edit.jpg",
    title: "Steel Wool Stars",
    categories: ["Urban"],
    sortOrder: 46,
  },
  {
    src: "/images/street/delivery-rider.jpg",
    title: "Delivery Rider",
    categories: ["Street"],
    sortOrder: 47,
  },
  {
    src: "/images/street/sunburst-walk.jpg",
    title: "Sunburst Walk",
    categories: ["Street"],
    sortOrder: 48,
  },
  {
    src: "/images/street/union-jack-suit.jpg",
    title: "Union Jack Suit",
    categories: ["Street"],
    sortOrder: 49,
  },
  {
    src: "/images/after-dark-cover.jpg",
    title: "Quiet Hours",
    categories: ["After Dark"],
    sortOrder: 50,
  },
  {
    src: "/images/lo-noodle-alley.jpg",
    title: "Noodle Alley",
    categories: ["After Dark"],
    sortOrder: 51,
  },
  {
    src: "/images/after-dark/rain-walk.jpg",
    title: "Rain Walk",
    categories: ["After Dark"],
    sortOrder: 52,
  },
  {
    src: "/images/after-dark/2F2E8CA6-A1DB-44ED-8879-E56955B99845.jpg",
    title: "After Dark 09",
    categories: ["Street"],
    sortOrder: 53,
  },
  {
    src: "/images/after-dark/46DB8C35-3B6D-4D6C-A04B-C7D5507F76D2.jpg",
    title: "Path Light",
    categories: ["Street"],
    sortOrder: 54,
  },
  {
    src: "/images/after-dark/762BEA4B-8793-4C72-A0CE-9308A2A8E87A.jpg",
    title: "Rain Glass",
    categories: ["After Dark"],
    sortOrder: 55,
  },
  {
    src: "/images/after-dark/red-door.jpg",
    title: "Red Door",
    categories: ["After Dark"],
    sortOrder: 56,
  },
  {
    src: "/images/after-dark/fog-street.jpg",
    title: "Fog Street",
    categories: ["After Dark"],
    sortOrder: 57,
  },
  {
    src: "/images/after-dark/shared-umbrella.jpg",
    title: "Shared Umbrella",
    categories: ["Street"],
    sortOrder: 58,
  },
  {
    src: "/images/after-dark/piccadilly-run.jpg",
    title: "Piccadilly Run",
    categories: ["Street"],
    sortOrder: 59,
  },
  {
    src: "/images/after-dark/blue-poncho.jpg",
    title: "Blue Poncho",
    categories: ["After Dark"],
    sortOrder: 60,
  },
  {
    src: "/images/after-dark/path-lights.jpg",
    title: "Path Lights",
    categories: ["After Dark"],
    sortOrder: 62,
  },
  {
    src: "/images/after-dark/night-train.jpg",
    title: "Night Train",
    categories: ["After Dark"],
    sortOrder: 64,
  },
  {
    src: "/images/after-dark/la-lasagne.jpg",
    title: "La Lasagne",
    categories: ["After Dark"],
    sortOrder: 65,
  },
  {
    src: "/images/after-dark/bus-stop.jpg",
    title: "Bus Stop",
    categories: ["After Dark"],
    sortOrder: 66,
  },
  {
    src: "/images/after-dark/night-grocery.jpg",
    title: "Night Grocery",
    categories: ["After Dark"],
    sortOrder: 67,
  },
  {
    src: "/images/after-dark/late-cafe.jpg",
    title: "Late Cafe",
    categories: ["Street"],
    sortOrder: 68,
  },
  {
    src: "/images/after-dark/snowflake-window.jpg",
    title: "Snowflake Window",
    categories: ["After Dark"],
    sortOrder: 69,
  },
  {
    src: "/images/after-dark/moulin-rouge.jpg",
    title: "Moulin Rouge",
    categories: ["Street"],
    sortOrder: 70,
  },
  {
    src: "/images/after-dark/piccadilly-crowd.jpg",
    title: "Piccadilly Crowd",
    categories: ["Street"],
    sortOrder: 71,
  },
  {
    src: "/images/after-dark/neon-coupe.jpg",
    title: "Neon Coupe",
    categories: ["After Dark"],
    sortOrder: 72,
  },
  {
    src: "/images/after-dark/fog-brake-lights.jpg",
    title: "Fog Brake Lights",
    categories: ["Street"],
    sortOrder: 73,
  },
  {
    src: "/images/after-dark/fog-petrol.jpg",
    title: "Fog Petrol",
    categories: ["After Dark"],
    sortOrder: 74,
  },
  {
    src: "/images/after-dark/fog-walker.jpg",
    title: "Fog Walker",
    categories: ["After Dark"],
    sortOrder: 75,
  },
  {
    src: "/images/after-dark/orange-lamp-fog.jpg",
    title: "Orange Lamp Fog",
    categories: ["After Dark"],
    sortOrder: 76,
  },
  {
    src: "/images/after-dark/red-signal-fog.jpg",
    title: "Red Signal Fog",
    categories: ["After Dark"],
    sortOrder: 77,
  },
  {
    src: "/images/after-dark/fog-station-pass.jpg",
    title: "Fog Station Pass",
    categories: ["Street"],
    sortOrder: 78,
  },
  {
    src: "/images/after-dark/rain-bus.jpg",
    title: "Rain Bus",
    categories: ["After Dark"],
    sortOrder: 79,
  },
  {
    src: "/images/after-dark/tower-bridge-fog.jpg",
    title: "Tower Bridge Fog",
    categories: ["After Dark"],
    sortOrder: 80,
  },
  {
    src: "/images/monochrome/spiral-stairs.jpg",
    title: "Spiral Stairs",
    categories: ["Monochrome"],
    sortOrder: 82,
  },
  {
    src: "/images/monochrome/contortionist.jpg",
    title: "Contortionist",
    categories: ["Monochrome"],
    sortOrder: 83,
  },
  {
    src: "/images/monochrome/one-poultry.jpg",
    title: "One Poultry",
    categories: ["Monochrome"],
    sortOrder: 84,
  },
  {
    src: "/images/monochrome/light-beams.jpg",
    title: "Light Beams",
    categories: ["Monochrome"],
    sortOrder: 85,
  },
  {
    src: "/images/monochrome/stair-light.jpg",
    title: "Stair Light",
    categories: ["Monochrome"],
    sortOrder: 86,
  },
  {
    src: "/images/monochrome/millipede-spiral.jpg",
    title: "Millipede Spiral",
    categories: ["Monochrome"],
    sortOrder: 87,
  },
  {
    src: "/images/monochrome/blindfold-piano.jpg",
    title: "Blindfold Piano",
    categories: ["Monochrome"],
    sortOrder: 88,
  },
  {
    src: "/images/urban/marina-viaduct.jpg",
    title: "Marina Viaduct",
    categories: ["Urban"],
    sortOrder: 90,
  },
];

export function photoInCategory(photo: Photo, category: PhotoCategory) {
  return photo.categories.includes(category);
}

export const afterDarkPhotos = photos
  .filter((photo) => photoInCategory(photo, "After Dark"))
  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

export const afterDarkCover =
  photos.find((photo) => photo.src.includes("after-dark-cover")) ??
  afterDarkPhotos[0] ??
  photos[0];

export const heroImage =
  photos.find((photo) => photo.src.includes("startrails")) ?? afterDarkCover;
