export type PhotoCategory = "Travel" | "Street" | "Night";
export type NightKind = "Street" | "Urban" | "Landscape" | "Astro";

export type Photo = {
  id?: string;
  src: string;
  title: string;
  categories: PhotoCategory[];
  nightKind?: NightKind;
  sortOrder?: number;
  storagePath?: string;
};

export const categories: PhotoCategory[] = ["Travel", "Street"];
export const nightKinds: NightKind[] = ["Street", "Urban", "Landscape", "Astro"];

export const photos: Photo[] = [
  {
    src: "/images/after-dark-cover.jpg",
    title: "Quiet Hours",
    categories: ["Street", "Night"],
    nightKind: "Street",
    sortOrder: 0,
  },
  {
    src: "/images/lo-noodle-alley.jpg",
    title: "Noodle Alley",
    categories: ["Street", "Night"],
    nightKind: "Street",
    sortOrder: 1,
  },
  {
    src: "/images/DJI_0464-HDR-Pano-Edit.jpg",
    title: "Aerial Panorama",
    categories: ["Travel"],
    sortOrder: 2,
  },
  {
    src: "/images/DJI_0117-HDR-Edit.jpg",
    title: "Aerial View",
    categories: ["Travel"],
    sortOrder: 3,
  },
  {
    src: "/images/DJI_0381-Edit.jpg",
    title: "Coast",
    categories: ["Travel"],
    sortOrder: 4,
  },
  {
    src: "/images/coastal-cove.jpg",
    title: "Coastal Cove",
    categories: ["Travel"],
    sortOrder: 5,
  },
  {
    src: "/images/trees.jpeg",
    title: "Trees",
    categories: ["Travel"],
    sortOrder: 6,
  },
  {
    src: "/images/A7303942-Edit2.jpg",
    title: "Landscape",
    categories: ["Travel"],
    sortOrder: 7,
  },
  {
    src: "/images/image_6483441.JPG",
    title: "Architecture",
    categories: ["Travel"],
    sortOrder: 8,
  },
  {
    src: "/images/image_6483441-2.JPG",
    title: "Northern Lights",
    categories: ["Travel", "Night"],
    nightKind: "Astro",
    sortOrder: 9,
  },
  {
    src: "/images/after-dark/0A9E1A4A-F5FB-4365-B12F-5BE1190395EB.jpg",
    title: "After Dark 03",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 10,
  },
  {
    src: "/images/after-dark/12093E8F-8DE7-4233-96E1-28D8270D0C25.jpg",
    title: "After Dark 05",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 11,
  },
  {
    src: "/images/after-dark/1322EAC0-7E67-47C5-8FC4-6A8D285E561C.jpg",
    title: "After Dark 06",
    categories: ["Travel"],
    sortOrder: 12,
  },
  {
    src: "/images/after-dark/1851EDDA-6D5C-40B1-A230-02BA6C0A6369.jpg",
    title: "After Dark 07",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 13,
  },
  {
    src: "/images/after-dark/26CDFA76-BFEA-4266-93DC-7A4BA3512337.jpg",
    title: "After Dark 08",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 14,
  },
  {
    src: "/images/after-dark/2F2E8CA6-A1DB-44ED-8879-E56955B99845.jpg",
    title: "After Dark 09",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 15,
  },
  {
    src: "/images/after-dark/46DB8C35-3B6D-4D6C-A04B-C7D5507F76D2.jpg",
    title: "After Dark 10",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 16,
  },
  {
    src: "/images/after-dark/5F0A7A9B-056C-4494-A5B2-9670B3596602.jpg",
    title: "After Dark 11",
    categories: ["Travel"],
    sortOrder: 17,
  },
  {
    src: "/images/after-dark/650CD8F4-159E-4E17-BF66-985E8DD1F47E.jpg",
    title: "After Dark 12",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 18,
  },
  {
    src: "/images/after-dark/762BEA4B-8793-4C72-A0CE-9308A2A8E87A.jpg",
    title: "After Dark 13",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 19,
  },
  {
    src: "/images/after-dark/78F56291-F28E-42FD-9CDC-C4C33CF10530.jpg",
    title: "After Dark 14",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 20,
  },
  {
    src: "/images/after-dark/79EA2245-F2AB-4F25-9A04-24007995E9C8.jpg",
    title: "After Dark 15",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 21,
  },
  {
    src: "/images/after-dark/7CF5E002-F8CC-449A-B1A5-B2F757C34CD3.jpg",
    title: "After Dark 16",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 22,
  },
  {
    src: "/images/after-dark/7E7A53E3-49A2-4BAA-8967-255434470242.jpg",
    title: "After Dark 17",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 23,
  },
  {
    src: "/images/after-dark/8C6C41DB-FBDB-449A-9DE0-C9E1164A3876.jpg",
    title: "After Dark 18",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 24,
  },
  {
    src: "/images/after-dark/A7302924.jpg",
    title: "City Lights",
    categories: ["Night"],
    nightKind: "Urban",
    sortOrder: 25,
  },
  {
    src: "/images/after-dark/A7308148-2.jpg",
    title: "Long Exposure",
    categories: ["Night"],
    nightKind: "Astro",
    sortOrder: 26,
  },
  {
    src: "/images/after-dark/C884E0B9-73BF-4C3B-AD2A-87F66FA575E1.jpg",
    title: "After Dark 20",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 27,
  },
  {
    src: "/images/after-dark/D28062C8-D542-4F6F-995E-DAD7790A7EC0.jpg",
    title: "After Dark 21",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 28,
  },
  {
    src: "/images/after-dark/DABA4D9F-F725-4871-ADF1-33567E2253C0.jpg",
    title: "After Dark 22",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 29,
  },
  {
    src: "/images/after-dark/DD5ECB7C-5ACC-455F-B574-0B1976D659C4.jpg",
    title: "After Dark 23",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 30,
  },
  {
    src: "/images/after-dark/DECBAFBD-1653-43A6-80AE-E599A9E65066.jpg",
    title: "After Dark 24",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 31,
  },
  {
    src: "/images/after-dark/DFB08D78-D13D-40B9-9154-898FBA4A7EEF.jpg",
    title: "After Dark 25",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 32,
  },
  {
    src: "/images/after-dark/E9823C88-C5A1-4102-B95E-13F2DD3F8371.jpg",
    title: "After Dark 26",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 33,
  },
  {
    src: "/images/after-dark/FIRE50edit.jpg",
    title: "Fire",
    categories: ["Night"],
    nightKind: "Urban",
    sortOrder: 34,
  },
  {
    src: "/images/after-dark/IMG_1610.jpg",
    title: "After Dark 27",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 35,
  },
  {
    src: "/images/after-dark/IMG_5539-1.jpg",
    title: "After Dark 28",
    categories: ["Night"],
    nightKind: "Landscape",
    sortOrder: 36,
  },
  {
    src: "/images/after-dark/_A736530-2-DeNoiseAI-severe-noise.jpg",
    title: "Severe Night",
    categories: ["Night"],
    nightKind: "Astro",
    sortOrder: 37,
  },
  {
    src: "/images/after-dark/startrails.jpg",
    title: "Star Trails",
    categories: ["Night"],
    nightKind: "Astro",
    sortOrder: 38,
  },
];

export function photoInCategory(photo: Photo, category: PhotoCategory) {
  return photo.categories.includes(category);
}

export const nightPhotos = photos
  .filter((photo) => photoInCategory(photo, "Night"))
  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

export const afterDarkCover =
  photos.find((photo) => photo.src.includes("after-dark-cover")) ?? photos[0];

export const heroImage =
  photos.find((photo) => photo.src.includes("startrails")) ?? afterDarkCover;
