export const PHOTO_CATEGORIES = [
  "Nature",
  "Urban",
  "Astro",
  "Street",
  "Monochrome",
  "After Dark",
  "Selected Work",
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export type CatalogPhoto = {
  id: string;
  title: string;
  /** Public web path under /images. */
  src: string;
  displayScale?: number;
};

export const photos: CatalogPhoto[] = [
  {
    id: "1b2d4738-c869-4f8d-ae4b-e2efe95116c8",
    title: "Blade Runner II",
    src: "/images/library/1b2d4738-c869-4f8d-ae4b-e2efe95116c8.jpg",
  },
  {
    id: "356af76a-354f-4946-aba3-41f643743d21",
    title: "Rain Mosaic",
    src: "/images/library/356af76a-354f-4946-aba3-41f643743d21.jpeg",
  },
  {
    id: "38e42988-2579-42d2-9bb4-bd40bb51900a",
    title: "Into the Fog",
    src: "/images/library/38e42988-2579-42d2-9bb4-bd40bb51900a.jpg",
  },
  {
    id: "3b16d59d-f994-424a-81aa-55ecbdb5f355",
    title: "Night Patrol",
    src: "/images/library/3b16d59d-f994-424a-81aa-55ecbdb5f355.jpeg",
  },
  {
    id: "47c7dc54-e5d9-4438-8af4-0a37d1e73a4d",
    title: "Before the Fire",
    src: "/images/library/47c7dc54-e5d9-4438-8af4-0a37d1e73a4d.jpg",
  },
  {
    id: "55f85f12-74ec-47c1-822d-62c48ff11728",
    title: "Still",
    src: "/images/after-dark/night-grocery.jpg",
  },
  {
    id: "6675b9b7-1845-49b8-99f0-d230e07741be",
    title: "Puddle jump",
    src: "/images/after-dark/piccadilly-run.jpg",
  },
  {
    id: "8e3f2510-1f20-4c6e-8ba1-04717adbc790",
    title: "Bond",
    src: "/images/after-dark/neon-coupe.jpg",
  },
  {
    id: "bdf3e195-1f07-4ed6-95bc-8e92d68bf33c",
    title: "Aerial Panorama",
    src: "/images/DJI_0464-HDR-Pano-Edit.jpg",
  },
  {
    id: "203268ba-f81f-4166-9ee6-b1d4a998e85d",
    title: "Aerial View",
    src: "/images/DJI_0117-HDR-Edit.jpg",
    displayScale: 0.84,
  },
  {
    id: "b1d54a34-7a7a-4144-8e37-aa4361a91c01",
    title: "Mountain Village",
    src: "/images/travel/mountain-village.jpg",
  },
  {
    id: "f62db040-54c5-4a10-ae40-ff5f82145efe",
    title: "Forest Divide",
    src: "/images/trees.jpeg",
    displayScale: 0.83,
  },
  {
    id: "1a68465d-2ab9-457c-a44f-cb6d957981ee",
    title: "Stags Clash",
    src: "/images/nature/stags-clash.jpg",
  },
  {
    id: "ab6db66f-0062-47c7-993a-c109034c2135",
    title: "Coastal Cove",
    src: "/images/coastal-cove.jpg",
  },
  {
    id: "b10f906d-f1fe-4d24-b12a-871ff9dcbf3e",
    title: "Volcanic Peaks",
    src: "/images/nature/volcanic-peaks.jpg",
  },
  {
    id: "c4a7612c-a713-4bc3-a7b3-cc62a8eec4a8",
    title: "Arch View",
    src: "/images/nature/arch-view.jpg",
  },
  {
    id: "d632a777-8005-47c0-a77c-3133d73cdefe",
    title: "Coastal Moon",
    src: "/images/nature/coastal-moon.jpg",
  },
  {
    id: "3fb20ab8-c31f-4338-a3d6-853aa5d08d68",
    title: "Ice Shore",
    src: "/images/nature/ice-shore.jpg",
  },
  {
    id: "69f189fa-dfb2-478f-84c9-39caf20bb1a0",
    title: "Alpine Church",
    src: "/images/travel/alpine-church.jpg",
    displayScale: 0.83,
  },
  {
    id: "0871cac5-f796-44d4-82b1-6c5b0e153a6b",
    title: "Hillside Lights",
    src: "/images/nature/hillside-lights.jpg",
    displayScale: 0.83,
  },
  {
    id: "8fef9b34-8d62-42db-a9e8-327da2e35aa9",
    title: "Valley Light",
    src: "/images/A7303942-Edit2.jpg",
  },
  {
    id: "3677b86e-92f2-4d23-b273-8065ea25f22d",
    title: "Island Outlook",
    src: "/images/travel/island-outlook.jpg",
    displayScale: 0.87,
  },
  {
    id: "6e9cb9b8-6fc8-4503-807c-24393ba6a5bf",
    title: "Sunset Shore",
    src: "/images/travel/sunset-shore.jpg",
  },
  {
    id: "314da13f-f2b6-4e33-8b8b-45d3d13b0e38",
    title: "Diamond Beach",
    src: "/images/travel/diamond-beach.jpg",
    displayScale: 0.84,
  },
  {
    id: "64715436-02d0-4579-a6d0-bde588939058",
    title: "Deer Herd",
    src: "/images/nature/deer-herd.jpg",
  },
  {
    id: "924e9b8c-db3f-4ef6-a83e-ec451350a806",
    title: "Glacial Lagoon",
    src: "/images/travel/glacial-lagoon.jpg",
  },
  {
    id: "baf0d631-c5fb-4b99-84f5-7ef467807b12",
    title: "Night Orbit",
    src: "/images/image_6483441.JPG",
    displayScale: 0.93,
  },
  {
    id: "b6c1d35c-7d0a-4758-a001-d7bad493986e",
    title: "Light Ring",
    src: "/images/after-dark/12093E8F-8DE7-4233-96E1-28D8270D0C25.jpg",
    displayScale: 0.78,
  },
  {
    id: "8eb79d15-aa19-45d3-ba83-c6a6bade2e87",
    title: "Blue Domes",
    src: "/images/after-dark/78F56291-F28E-42FD-9CDC-C4C33CF10530.jpg",
  },
  {
    id: "272cdb49-00e7-44a0-8a83-5ae2cf6ecc7b",
    title: "City Lights",
    src: "/images/after-dark/A7302924.jpg",
    displayScale: 0.85,
  },
  {
    id: "7d8579c5-f585-4fc4-a8e9-284715f78539",
    title: "Window Grid",
    src: "/images/after-dark/window-grid.jpg",
    displayScale: 0.84,
  },
  {
    id: "3ded4f9a-a6c0-40a0-baae-311a015c3d3a",
    title: "Snow Street",
    src: "/images/urban/snow-street.jpg",
  },
  {
    id: "2ff79815-7fc7-4711-80b4-970af9589ca3",
    title: "Bus Reflection",
    src: "/images/urban/bus-reflection.jpg",
  },
  {
    id: "b70ee0ef-0dbf-497d-8ed3-cc2418d5c205",
    title: "Hallgrimskirkja",
    src: "/images/after-dark/D28062C8-D542-4F6F-995E-DAD7790A7EC0.jpg",
  },
  {
    id: "9cf36d6c-63fc-4ca0-8920-09215553d463",
    title: "Marina Viaduct",
    src: "/images/urban/marina-viaduct.jpg",
  },
  {
    id: "03b7f42c-9804-48f8-9ed9-fc353cd03c41",
    title: "Aurora Watch",
    src: "/images/after-dark/C884E0B9-73BF-4C3B-AD2A-87F66FA575E1.jpg",
    displayScale: 0.82,
  },
  {
    id: "b6d80b84-3209-4192-84e6-3579ab964a36",
    title: "Westminster Cyclist",
    src: "/images/urban/westminster-cyclist.jpg",
  },
  {
    id: "0cbcddc2-8c31-4f6f-aa0d-baad6954f9a6",
    title: "Star Road",
    src: "/images/after-dark/650CD8F4-159E-4E17-BF66-985E8DD1F47E.jpg",
    displayScale: 0.78,
  },
  {
    id: "d4543162-ae56-4467-83bd-78b1ac5143e8",
    title: "Star Trails Path",
    src: "/images/after-dark/26CDFA76-BFEA-4266-93DC-7A4BA3512337.jpg",
    displayScale: 0.69,
  },
  {
    id: "c3fc0889-0217-4298-b0e6-6d023a813c9c",
    title: "Comet Field",
    src: "/images/after-dark/A7308148-2.jpg",
  },
  {
    id: "ce8e2d93-c4ba-43ed-b256-ad6cc762df3b",
    title: "Tower Star Trails",
    src: "/images/astro/tower-star-trails.jpg",
  },
  {
    id: "6e25b7bf-4acd-48e5-b9f9-2b961441dbf9",
    title: "Aurora Boat",
    src: "/images/after-dark/DECBAFBD-1653-43A6-80AE-E599A9E65066.jpg",
    displayScale: 0.83,
  },
  {
    id: "eacc1093-8d84-43ba-b534-73834456905c",
    title: "Star Trails",
    src: "/images/after-dark/startrails.jpg",
  },
  {
    id: "21969202-121e-4355-9cc7-d18610e2544d",
    title: "Aurora Cabin",
    src: "/images/after-dark/DD5ECB7C-5ACC-455F-B574-0B1976D659C4.jpg",
  },
  {
    id: "43b97199-f5b7-45cc-9e25-59eed803e36e",
    title: "Kirkjufell Aurora",
    src: "/images/after-dark/_A736530-2-DeNoiseAI-severe-noise.jpg",
  },
  {
    id: "1f4c99af-3ce6-4b81-913c-2a614bfbae58",
    title: "Comet Tree",
    src: "/images/after-dark/DFB08D78-D13D-40B9-9154-898FBA4A7EEF.jpg",
    displayScale: 0.85,
  },
  {
    id: "72b94344-1526-4476-a524-4b0caeab0c79",
    title: "Steel Wool Stars",
    src: "/images/after-dark/FIRE50edit.jpg",
  },
  {
    id: "43bd0b20-dae0-408a-af2e-f57493b19f99",
    title: "Shared Umbrella",
    src: "/images/after-dark/shared-umbrella.jpg",
  },
  {
    id: "1107940c-5d3a-4d44-b82d-0e7149e22fb4",
    title: "Noodle Alley",
    src: "/images/lo-noodle-alley.jpg",
    displayScale: 0.89,
  },
  {
    id: "cbe2ba04-ac3b-4c39-804d-0578b18f1c95",
    title: "Night Corner",
    src: "/images/after-dark/2F2E8CA6-A1DB-44ED-8879-E56955B99845.jpg",
  },
  {
    id: "96a90fbe-661f-44bd-a8c1-5744bd0546af",
    title: "Delivery Rider",
    src: "/images/street/delivery-rider.jpg",
  },
  {
    id: "c2231472-836b-41a2-b2f2-c07f3fdcbeed",
    title: "Blue Poncho",
    src: "/images/after-dark/blue-poncho.jpg",
  },
  {
    id: "34bf5a41-0320-4c7a-88fe-449093edc39a",
    title: "Quiet Hours",
    src: "/images/after-dark-cover.jpg",
  },
  {
    id: "dc81dea4-df9e-49c5-80fb-df89d2586e5a",
    title: "Fog Street",
    src: "/images/after-dark/fog-street.jpg",
    displayScale: 0.81,
  },
  {
    id: "f1162002-991f-4080-8810-b6481afae220",
    title: "Sunburst Walk",
    src: "/images/street/sunburst-walk.jpg",
  },
  {
    id: "19c88805-ce69-4f38-82af-7ce2af17a35e",
    title: "Late Cafe",
    src: "/images/after-dark/late-cafe.jpg",
  },
  {
    id: "9ce37ede-1f0b-4fc5-9f8c-e2c05084eb43",
    title: "Path Lights",
    src: "/images/after-dark/path-lights.jpg",
  },
  {
    id: "2b534e69-8e7a-411a-a4f1-a0122c9ef7c4",
    title: "Fog Petrol",
    src: "/images/after-dark/fog-petrol.jpg",
    displayScale: 0.83,
  },
  {
    id: "c5c3a676-a71b-4008-87e4-0c15156927ea",
    title: "Pizza flip",
    src: "/images/after-dark/la-lasagne.jpg",
  },
  {
    id: "60bc2fd6-2298-4f30-8d16-91449c2e2c40",
    title: "Among us",
    src: "/images/after-dark/snowflake-window.jpg",
    displayScale: 0.71,
  },
  {
    id: "be538a1c-5cf5-4c50-bd42-372d9243e63d",
    title: "Union Jack Suit",
    src: "/images/street/union-jack-suit.jpg",
    displayScale: 0.82,
  },
  {
    id: "73e7fe01-c712-48b0-b73c-aa67e115b3f0",
    title: "Night Shift",
    src: "/images/after-dark/night-train.jpg",
  },
  {
    id: "f278b76c-d383-40e4-92a6-b8717dc8a9a3",
    title: "Fortnum Night",
    src: "/images/urban/fortnum-night.jpg",
    displayScale: 0.83,
  },
  {
    id: "b3c4c6a5-3a9c-4e07-aa93-a72063b18851",
    title: "Whisper",
    src: "/images/after-dark/piccadilly-crowd.jpg",
  },
  {
    id: "2133263b-0cd3-4e4c-bddd-195fe6711901",
    title: "Fog Brake Lights",
    src: "/images/after-dark/fog-brake-lights.jpg",
    displayScale: 0.83,
  },
  {
    id: "3d09f9d2-40a7-4b91-9bb8-f0dab2200c9a",
    title: "CyberPunk",
    src: "/images/after-dark/fog-walker.jpg",
  },
  {
    id: "8e9a5c63-5a9f-4123-b6a1-76b0060568dd",
    title: "Around the corner",
    src: "/images/after-dark/orange-lamp-fog.jpg",
  },
  {
    id: "f86f5314-48f0-4309-b9c0-4452ff3d2d4f",
    title: "Red light",
    src: "/images/after-dark/red-signal-fog.jpg",
  },
  {
    id: "252efe89-5be4-428e-a9af-628d3cdac93d",
    title: "Fog Station Pass",
    src: "/images/after-dark/fog-station-pass.jpg",
  },
  {
    id: "40cf37c1-c62a-41ad-83f2-8e63d904d610",
    title: "Rain Bus",
    src: "/images/after-dark/rain-bus.jpg",
  },
  {
    id: "78f8f56f-df92-4e52-89e2-26eb4022fbf0",
    title: "Tower Bridge Fog",
    src: "/images/after-dark/tower-bridge-fog.jpg",
    displayScale: 0.8,
  },
  {
    id: "5b941575-47fe-4e82-a9e5-cf809eaefe8a",
    title: "Contortionist",
    src: "/images/monochrome/contortionist.jpg",
    displayScale: 0.78,
  },
  {
    id: "92f47f97-aa0d-40bc-885a-31e936d7b759",
    title: "One Poultry",
    src: "/images/monochrome/one-poultry.jpg",
  },
  {
    id: "a35d6ba1-f234-4913-aea8-ed42dd5c6b41",
    title: "Light Beams",
    src: "/images/monochrome/light-beams.jpg",
    displayScale: 0.96,
  },
  {
    id: "cf67273f-6d89-40d3-8049-1241ed15781d",
    title: "Stair Light",
    src: "/images/monochrome/stair-light.jpg",
  },
  {
    id: "226825e3-869c-4916-8535-5d8081986dbd",
    title: "Blindfold Piano",
    src: "/images/monochrome/blindfold-piano.jpg",
    displayScale: 0.87,
  },
  {
    id: "e8976705-9b2f-4a51-bbe9-60ef13df1b0c",
    title: "Millipede Spiral",
    src: "/images/monochrome/millipede-spiral.jpg",
    displayScale: 0.93,
  },
  {
    id: "036ea7bd-9c6e-477d-b09b-e1496ee1b612",
    title: "Moulin Rouge",
    src: "/images/after-dark/moulin-rouge.jpg",
    displayScale: 0.83,
  },
  {
    id: "3d88d88a-cf11-4997-883d-b4ad813e1c8d",
    title: "Black Shore",
    src: "/images/library/3d88d88a-cf11-4997-883d-b4ad813e1c8d.jpeg",
  },
  {
    id: "d5640a35-ffb2-4e4d-b4cc-bbc8375a43c2",
    title: "Quiet Reader",
    src: "/images/library/d5640a35-ffb2-4e4d-b4cc-bbc8375a43c2.jpeg",
  },
  {
    id: "e3ca3121-ba77-497c-8ed6-13a861b4031d",
    title: "Folded Passenger",
    src: "/images/library/e3ca3121-ba77-497c-8ed6-13a861b4031d.jpeg",
  },
  {
    id: "378bdba9-36ee-400a-ac61-cc774c65179f",
    title: "Reflected Reader",
    src: "/images/library/378bdba9-36ee-400a-ac61-cc774c65179f.jpg",
  },
  {
    id: "50e76542-9026-4508-b5ae-013025948903",
    title: "Concrete Curve",
    src: "/images/library/50e76542-9026-4508-b5ae-013025948903.jpeg",
  },
  {
    id: "58b02eb7-793d-425f-a11c-d4f6d255f522",
    title: "Glacier Watch",
    src: "/images/library/58b02eb7-793d-425f-a11c-d4f6d255f522.jpeg",
  },
  {
    id: "41d00534-be01-4583-bbf8-c8bc42cddfce",
    title: "Rue Drouin",
    src: "/images/library/41d00534-be01-4583-bbf8-c8bc42cddfce.jpeg",
  },
  {
    id: "006c5764-b2e3-4f10-85ae-825355fc7ffa",
    title: "Harrow 483",
    src: "/images/library/006c5764-b2e3-4f10-85ae-825355fc7ffa.jpg",
  },
  {
    id: "5613f62a-3bfd-4a95-894c-869357be70f4",
    title: "Disc Facade",
    src: "/images/library/5613f62a-3bfd-4a95-894c-869357be70f4.jpeg",
  },
  {
    id: "a971b90f-6c23-40d1-98de-a04550fba558",
    title: "Four Shadows",
    src: "/images/library/a971b90f-6c23-40d1-98de-a04550fba558.jpg",
  },
  {
    id: "8946b567-6e7f-481e-973c-ebf0a9888f5c",
    title: "Five Ronalds",
    src: "/images/library/8946b567-6e7f-481e-973c-ebf0a9888f5c.jpg",
  },
  {
    id: "0c183d11-1166-4a87-89e3-56001a323912",
    title: "Illuminated Dome",
    src: "/images/library/0c183d11-1166-4a87-89e3-56001a323912.jpg",
  },
  {
    id: "0c810b66-ca44-4ec5-a08b-5140b168984c",
    title: "Tower Bridge, Dissolving",
    src: "/images/library/0c810b66-ca44-4ec5-a08b-5140b168984c.jpg",
  },
  {
    id: "9776b913-481a-411d-b00e-5937fe343d19",
    title: "Blue Oculus",
    src: "/images/library/9776b913-481a-411d-b00e-5937fe343d19.jpg",
  },
  {
    id: "565dfc32-b623-431f-863b-6831ae37e17f",
    title: "Soho Kitchen",
    src: "/images/library/565dfc32-b623-431f-863b-6831ae37e17f.jpg",
  },
  {
    id: "bb70d8e9-fa26-41c8-9142-0cd96d19a24a",
    title: "Lantern Wall",
    src: "/images/library/bb70d8e9-fa26-41c8-9142-0cd96d19a24a.jpg",
  },
  {
    id: "9b060ddf-63f5-4d2a-bf29-36faee0617f6",
    title: "Green chef",
    src: "/images/library/9b060ddf-63f5-4d2a-bf29-36faee0617f6.jpg",
  },
  {
    id: "6c276c5b-ee9e-4159-8f00-e679974f3782",
    title: "Waiting with Ronald",
    src: "/images/library/6c276c5b-ee9e-4159-8f00-e679974f3782.jpg",
  },
  {
    id: "6b430211-6d95-4bcc-99cb-4b3838d5c67c",
    title: "Crater Chain",
    src: "/images/library/6b430211-6d95-4bcc-99cb-4b3838d5c67c.jpg",
  },
  {
    id: "f62c29ce-efd5-4b39-83ad-3fff5e2734ca",
    title: "Refuge Below the Peaks",
    src: "/images/library/f62c29ce-efd5-4b39-83ad-3fff5e2734ca.jpg",
  },
  {
    id: "9653e534-8008-4ef4-abe3-5b3ad462777c",
    title: "Message on the Shore",
    src: "/images/library/9653e534-8008-4ef4-abe3-5b3ad462777c.jpg",
  },
  {
    id: "8888070b-11fe-48f1-bd31-ae41b5b2b382",
    title: "First Table",
    src: "/images/library/8888070b-11fe-48f1-bd31-ae41b5b2b382.jpg",
  },
  {
    id: "2b5e5125-7c7c-47e4-92b6-37f4695bf207",
    title: "Roof Rhythm",
    src: "/images/library/2b5e5125-7c7c-47e4-92b6-37f4695bf207.jpg",
  },
  {
    id: "16e59826-8bed-4737-9fa4-d2961c9b0528",
    title: "Rift Above the Sea",
    src: "/images/library/16e59826-8bed-4737-9fa4-d2961c9b0528.jpg",
  },
  {
    id: "294030c0-bd7d-40ce-81f1-a2501b443084",
    title: "At the Falls",
    src: "/images/library/294030c0-bd7d-40ce-81f1-a2501b443084.jpg",
  },
  {
    id: "347adb86-45a1-4e62-87fa-61aa2d5746b1",
    title: "Pasture Rainbow",
    src: "/images/library/347adb86-45a1-4e62-87fa-61aa2d5746b1.jpg",
  },
  {
    id: "20dc45b9-b5ff-4d47-9ee4-5a42645932fe",
    title: "Moonlit Gesture",
    src: "/images/library/20dc45b9-b5ff-4d47-9ee4-5a42645932fe.jpg",
  },
  {
    id: "d60b9ccb-0339-4565-8740-f9ec9812f0a2",
    title: "Kirkjufell Falls",
    src: "/images/library/d60b9ccb-0339-4565-8740-f9ec9812f0a2.jpg",
  },
  {
    id: "5451af8d-8079-48d2-99e5-8acea3f0efe4",
    title: "Veiled Valley",
    src: "/images/library/5451af8d-8079-48d2-99e5-8acea3f0efe4.jpg",
  },
  {
    id: "c260bf71-3c5a-4f30-9ed1-8ca5d39e8cd8",
    title: "Before the Great Door",
    src: "/images/library/c260bf71-3c5a-4f30-9ed1-8ca5d39e8cd8.jpg",
  },
  {
    id: "37467984-1bd6-471c-a07c-becee2888fff",
    title: "Winter Crossing",
    src: "/images/library/37467984-1bd6-471c-a07c-becee2888fff.jpg",
  },
  {
    id: "c7ee406c-8e53-4eeb-a609-0e6f15ff322d",
    title: "Walking the Rain",
    src: "/images/library/c7ee406c-8e53-4eeb-a609-0e6f15ff322d.jpg",
  },
  {
    id: "1be35441-9ea0-420d-8900-2bb1d84e61be",
    title: "City Hall Curve",
    src: "/images/library/1be35441-9ea0-420d-8900-2bb1d84e61be.jpg",
  },
  {
    id: "405d7027-acbb-4d55-ade3-08139b84622f",
    title: "Milky Way over the Village",
    src: "/images/library/405d7027-acbb-4d55-ade3-08139b84622f.jpg",
  },
  {
    id: "a6d2d01d-0cef-468d-a5fd-f67a2d524357",
    title: "Milky Way over the House",
    src: "/images/library/a6d2d01d-0cef-468d-a5fd-f67a2d524357.jpg",
  },
  {
    id: "96f9764d-d4f8-4905-8d00-12cd4162013e",
    title: "Crossing the Lines",
    src: "/images/library/96f9764d-d4f8-4905-8d00-12cd4162013e.jpg",
  },
  {
    id: "47c2290f-0f14-493d-a87a-d03d0aec000d",
    title: "Into the Light",
    src: "/images/library/47c2290f-0f14-493d-a87a-d03d0aec000d.jpg",
  },
  {
    id: "1c01fded-1569-466f-a714-4e12146b0b0b",
    title: "Mount Olympus",
    src: "/images/library/1c01fded-1569-466f-a714-4e12146b0b0b.jpg",
  },
  {
    id: "098290c7-7fb1-426e-b663-01ede811c43c",
    title: "Oia After Dark",
    src: "/images/library/098290c7-7fb1-426e-b663-01ede811c43c.jpg",
  },
  {
    id: "8406a087-ba75-4625-b250-897328a81ddb",
    title: "Three by the Harbour",
    src: "/images/library/8406a087-ba75-4625-b250-897328a81ddb.jpg",
  },
  {
    id: "aa4ab07a-d000-4c07-83bd-3b6966e69e1c",
    title: "White Geometry",
    src: "/images/library/aa4ab07a-d000-4c07-83bd-3b6966e69e1c.jpg",
  },
  {
    id: "a01db749-148b-4bef-a88b-fdcad60f0f17",
    title: "White Corner",
    src: "/images/library/a01db749-148b-4bef-a88b-fdcad60f0f17.jpg",
  },
  {
    id: "c1c88b2e-12aa-4269-890c-1726893586a1",
    title: "The Cat Keeper",
    src: "/images/library/c1c88b2e-12aa-4269-890c-1726893586a1.jpg",
  },
  {
    id: "aa84fc5e-2b1d-4972-9b56-3e09eee8cc73",
    title: "The Courier and the Mannequin",
    src: "/images/library/aa84fc5e-2b1d-4972-9b56-3e09eee8cc73.jpg",
  },
  {
    id: "bfc15d09-6c56-4a31-8a84-00b051b3c809",
    title: "Toward Happiness",
    src: "/images/library/bfc15d09-6c56-4a31-8a84-00b051b3c809.jpg",
  },
  {
    id: "924cdba2-5089-45e7-ba2a-8f327cd360a9",
    title: "Blue",
    src: "/images/library/924cdba2-5089-45e7-ba2a-8f327cd360a9.jpg",
  },
  {
    id: "02329efe-68a5-4863-8ba6-929aff868433",
    title: "Under the Arch",
    src: "/images/library/02329efe-68a5-4863-8ba6-929aff868433.jpg",
  },
  {
    id: "edc72500-94f2-4674-8575-40e54ebf5eb0",
    title: "Under Two Arches",
    src: "/images/library/edc72500-94f2-4674-8575-40e54ebf5eb0.jpg",
  },
  {
    id: "393b3493-7d2d-4038-9e21-c1618451e25e",
    title: "White Church, Black Sky",
    src: "/images/library/393b3493-7d2d-4038-9e21-c1618451e25e.jpg",
  },
  {
    id: "910b536d-17b1-4a9c-b6b4-7733d731263e",
    title: "Opposite Directions",
    src: "/images/library/910b536d-17b1-4a9c-b6b4-7733d731263e.jpg",
  },
  {
    id: "e2ee83e3-01d9-4f63-a6b7-bfef1847b525",
    title: "Coastline Milky Way",
    src: "/images/library/e2ee83e3-01d9-4f63-a6b7-bfef1847b525.jpg",
  },
  {
    id: "2568788a-2bb4-4642-b53a-26211cf1ad0d",
    title: "Shard Between Curves",
    src: "/images/library/2568788a-2bb4-4642-b53a-26211cf1ad0d.jpg",
  },
  {
    id: "c48bdfb0-5a91-4e61-82db-53ecf83280f7",
    title: "Empty Platform",
    src: "/images/library/c48bdfb0-5a91-4e61-82db-53ecf83280f7.jpg",
  },
  {
    id: "a22fcf04-b7c3-4a60-bb8a-64a0fdd5dce6",
    title: "Island at Dusk",
    src: "/images/library/a22fcf04-b7c3-4a60-bb8a-64a0fdd5dce6.jpg",
  },
  {
    id: "bb1ff775-1324-4108-b3b1-184894646b90",
    title: "Through the Arch",
    src: "/images/library/bb1ff775-1324-4108-b3b1-184894646b90.jpg",
  },
  {
    id: "d1eeac80-502e-4d21-a63a-9e285dd0125d",
    title: "At the Monument",
    src: "/images/library/d1eeac80-502e-4d21-a63a-9e285dd0125d.jpg",
  },
  {
    id: "f0ba66b5-2fbd-4eb9-bd23-680dc08ee723",
    title: "The Lookout",
    src: "/images/library/f0ba66b5-2fbd-4eb9-bd23-680dc08ee723.jpg",
  },
  {
    id: "f4b55015-1d95-4c34-b00a-6ca5795203e2",
    title: "Under the Word",
    src: "/images/library/f4b55015-1d95-4c34-b00a-6ca5795203e2.jpg",
  },
  {
    id: "9a7d5ba1-83d2-4f97-a6b7-24e159d97f0b",
    title: "Table for Two",
    src: "/images/library/9a7d5ba1-83d2-4f97-a6b7-24e159d97f0b.jpg",
  },
  {
    id: "a552d64f-6869-4bef-8ccc-cb042f00fd00",
    title: "Incognito",
    src: "/images/library/a552d64f-6869-4bef-8ccc-cb042f00fd00.jpg",
  },
  {
    id: "1152d82a-aea3-43ed-8e39-e6cebb6511d3",
    title: "Headless",
    src: "/images/library/1152d82a-aea3-43ed-8e39-e6cebb6511d3.jpg",
  },
  {
    id: "e36540e4-c07e-4d12-93ee-e68ce547d2ee",
    title: "Sun Through Tower Bridge",
    src: "/images/library/e36540e4-c07e-4d12-93ee-e68ce547d2ee.jpg",
  },
  {
    id: "949844ed-ed39-4905-8387-0f3af4b6eee7",
    title: "Two Generations",
    src: "/images/library/949844ed-ed39-4905-8387-0f3af4b6eee7.jpg",
  },
  {
    id: "2cf5df80-144a-47a8-8397-68ebc4138b17",
    title: "Double Up",
    src: "/images/library/2cf5df80-144a-47a8-8397-68ebc4138b17.jpg",
  },
  {
    id: "dcafceac-be55-43ce-903a-c3a750d4daae",
    title: "Between the Curves",
    src: "/images/library/dcafceac-be55-43ce-903a-c3a750d4daae.jpg",
  },
  {
    id: "b641eafb-cfd0-4e01-b051-230cf227dc8c",
    title: "Blade Runner",
    src: "/images/library/b641eafb-cfd0-4e01-b051-230cf227dc8c.jpg",
  },
  {
    id: "367dad40-f822-473a-9876-c83361eac89a",
    title: "Long Shadow",
    src: "/images/library/367dad40-f822-473a-9876-c83361eac89a.jpg",
  },
  {
    id: "274e052d-faf5-40e6-8646-6fae02378243",
    title: "Last Bus",
    src: "/images/library/274e052d-faf5-40e6-8646-6fae02378243.jpg",
  },
  {
    id: "fcdf7da3-558c-4934-a6dd-fe9b73f36453",
    title: "A Kiss on Bond Street",
    src: "/images/library/fcdf7da3-558c-4934-a6dd-fe9b73f36453.jpg",
  },
  {
    id: "aa1ffd91-e5e6-4b6e-860c-a0a0817a0a10",
    title: "The Fur Seller",
    src: "/images/library/aa1ffd91-e5e6-4b6e-860c-a0a0817a0a10.jpg",
  },
  {
    id: "b5f18da2-1b5d-4163-b6e1-062aa9f93638",
    title: "Red Witness",
    src: "/images/library/b5f18da2-1b5d-4163-b6e1-062aa9f93638.jpg",
  },
  {
    id: "f4e779a2-695f-485e-832c-1a035294b41e",
    title: "Afterimage at Sunset",
    src: "/images/library/f4e779a2-695f-485e-832c-1a035294b41e.jpg",
  },
  {
    id: "238db2a7-c591-485f-9ec8-428456052236",
    title: "Open Window",
    src: "/images/library/238db2a7-c591-485f-9ec8-428456052236.jpg",
  },
  {
    id: "d37c812f-a2b2-4e19-a4c6-a55eff106216",
    title: "Vanishing Passage",
    src: "/images/library/d37c812f-a2b2-4e19-a4c6-a55eff106216.jpg",
  },
  {
    id: "fa0d8bac-a2a3-43bf-a3b0-8d2289b7c724",
    title: "Two Selves",
    src: "/images/library/fa0d8bac-a2a3-43bf-a3b0-8d2289b7c724.jpeg",
  },
  {
    id: "152013b0-3194-4eec-a2da-b014a5640019",
    title: "Window Under the Stars",
    src: "/images/library/152013b0-3194-4eec-a2da-b014a5640019.jpeg",
  },
  {
    id: "7cb7b6b4-8554-4789-87e6-aba8209f43e6",
    title: "Underground Rush",
    src: "/images/library/7cb7b6b4-8554-4789-87e6-aba8209f43e6.jpeg",
  },
  {
    id: "c0926dc4-4b3a-4ba9-bd45-3df2b5fe1313",
    title: "End of the Pier",
    src: "/images/library/c0926dc4-4b3a-4ba9-bd45-3df2b5fe1313.jpeg",
  },
  {
    id: "29262f21-5d4b-4834-bbd7-51fd7837c576",
    title: "Kayaks in the Rock Pool",
    src: "/images/library/29262f21-5d4b-4834-bbd7-51fd7837c576.jpeg",
  },
  {
    id: "6f221518-d3ff-4b20-ad60-d3d7136f9ce7",
    title: "The Bridge Keeper",
    src: "/images/library/6f221518-d3ff-4b20-ad60-d3d7136f9ce7.jpeg",
  },
  {
    id: "164f07b9-5c80-4b5f-8403-14648ccccdb1",
    title: "White Silence",
    src: "/images/library/164f07b9-5c80-4b5f-8403-14648ccccdb1.jpeg",
  },
  {
    id: "fe7692af-5eb2-47e6-8002-b192e8672697",
    title: "Rain Edition",
    src: "/images/library/fe7692af-5eb2-47e6-8002-b192e8672697.jpeg",
  },
  {
    id: "f1ed7f5f-6388-408b-8324-6c6ac6f049be",
    title: "Bowler Hat",
    src: "/images/library/f1ed7f5f-6388-408b-8324-6c6ac6f049be.jpeg",
  },
  {
    id: "843d45ab-3362-4a11-8679-30395fb4f912",
    title: "Street Mirror",
    src: "/images/library/843d45ab-3362-4a11-8679-30395fb4f912.jpeg",
  },
  {
    id: "7b77ce5b-38ca-4b83-9301-df2c1698b894",
    title: "Suffocating",
    src: "/images/library/7b77ce5b-38ca-4b83-9301-df2c1698b894.jpeg",
  },
  {
    id: "eff9715e-a498-43fc-9722-752ff5fb8560",
    title: "Threshold",
    src: "/images/library/eff9715e-a498-43fc-9722-752ff5fb8560.jpeg",
  },
  {
    id: "ee42da72-1721-4f6f-9728-dba9b336cfa4",
    title: "Moulin Rouge, Reflected",
    src: "/images/library/ee42da72-1721-4f6f-9728-dba9b336cfa4.jpeg",
  },
  {
    id: "9c44366f-a8b6-470e-9095-8d0585140457",
    title: "Remembrance",
    src: "/images/library/9c44366f-a8b6-470e-9095-8d0585140457.jpeg",
  },
  {
    id: "c23560e6-955e-41a0-bc50-46c2349a372b",
    title: "Peaky Blinder",
    src: "/images/library/c23560e6-955e-41a0-bc50-46c2349a372b.jpeg",
  },
  {
    id: "d8baea99-9555-4fbb-93d8-71df120adaf5",
    title: "Boathouse Under Storm",
    src: "/images/library/d8baea99-9555-4fbb-93d8-71df120adaf5.jpeg",
  },
  {
    id: "1c68a306-1935-4133-bcbf-7ad09ff3d681",
    title: "Cyclist and Shadow",
    src: "/images/library/1c68a306-1935-4133-bcbf-7ad09ff3d681.jpeg",
  },
  {
    id: "f5e447dc-9d8b-4160-8bda-73ed50b68da9",
    title: "White Socks",
    src: "/images/library/f5e447dc-9d8b-4160-8bda-73ed50b68da9.jpeg",
  },
  {
    id: "c1dc98fa-65f7-4d75-9d34-d51ed3c7a0ff",
    title: "Night Shift",
    src: "/images/library/c1dc98fa-65f7-4d75-9d34-d51ed3c7a0ff.jpeg",
  },
  {
    id: "4dd5eae3-1a56-4a29-a471-e5687323a1ce",
    title: "Orange Passenger",
    src: "/images/library/4dd5eae3-1a56-4a29-a471-e5687323a1ce.jpeg",
  },
  {
    id: "3b55ea48-3f13-4dbf-af63-13a9bc8b90ab",
    title: "Cave of Two Waters",
    src: "/images/library/3b55ea48-3f13-4dbf-af63-13a9bc8b90ab.jpeg",
  },
  {
    id: "1f47c90e-609b-494f-8907-b9b63a942529",
    title: "Passing the Wedge",
    src: "/images/library/1f47c90e-609b-494f-8907-b9b63a942529.jpeg",
  },
  {
    id: "08c28691-a413-43a5-ae19-83f12bd43f5d",
    title: "Crossing the Light",
    src: "/images/library/08c28691-a413-43a5-ae19-83f12bd43f5d.jpeg",
  },
  {
    id: "c90af63c-d002-4ce5-8fd6-00d857badaac",
    title: "The Long Path",
    src: "/images/library/c90af63c-d002-4ce5-8fd6-00d857badaac.jpeg",
  },
  {
    id: "6cc4b3b5-e35a-434b-a57f-2f96121ac3c8",
    title: "Snow Walk",
    src: "/images/library/6cc4b3b5-e35a-434b-a57f-2f96121ac3c8.jpeg",
  },
  {
    id: "66241e6c-47e2-4cfa-9140-ff6bf745adf1",
    title: "Red Runner",
    src: "/images/library/66241e6c-47e2-4cfa-9140-ff6bf745adf1.jpeg",
  },
  {
    id: "6adbca54-a174-4734-a0ac-d8d31e44a554",
    title: "Red Corner",
    src: "/images/library/6adbca54-a174-4734-a0ac-d8d31e44a554.jpeg",
  },
  {
    id: "20b030c0-2043-4f23-8ff1-f22a0a22880e",
    title: "Waiting Under the Lamps",
    src: "/images/library/20b030c0-2043-4f23-8ff1-f22a0a22880e.jpeg",
  },
  {
    id: "dad7ce5e-2044-4e79-b808-0f088347b1af",
    title: "In  the woods",
    src: "/images/library/dad7ce5e-2044-4e79-b808-0f088347b1af.jpeg",
  },
  {
    id: "4b75e9a7-7885-468c-be23-aa5554408f40",
    title: "Between the Doors",
    src: "/images/library/4b75e9a7-7885-468c-be23-aa5554408f40.jpeg",
  },
  {
    id: "2bc32322-3598-4cd5-a4eb-32ebbc6c3d99",
    title: "After Leopoldstadt",
    src: "/images/library/2bc32322-3598-4cd5-a4eb-32ebbc6c3d99.jpeg",
  },
  {
    id: "b6614dbe-693e-44d2-93dd-55124dc6006b",
    title: "The Bright End",
    src: "/images/library/b6614dbe-693e-44d2-93dd-55124dc6006b.jpeg",
  },
  {
    id: "9f01941a-717d-453b-b7c5-6da4baf2a84c",
    title: "Cyclist in Light",
    src: "/images/library/9f01941a-717d-453b-b7c5-6da4baf2a84c.jpeg",
  },
  {
    id: "71cef58f-10ef-4d5b-963d-721b0ceef3a4",
    title: "In Front of the Sale",
    src: "/images/library/71cef58f-10ef-4d5b-963d-721b0ceef3a4.jpeg",
  },
  {
    id: "02aaa31a-d1e1-45ad-bd99-4c81a14ee4c1",
    title: "At the Memorial",
    src: "/images/library/02aaa31a-d1e1-45ad-bd99-4c81a14ee4c1.jpeg",
  },
  {
    id: "00c02aa9-9d75-4d98-a45a-532980754bec",
    title: "Eleven Windows",
    src: "/images/library/00c02aa9-9d75-4d98-a45a-532980754bec.jpeg",
  },
  {
    id: "5724fb23-cad3-478d-ab55-53b397b0fe68",
    title: "White Peacock",
    src: "/images/library/5724fb23-cad3-478d-ab55-53b397b0fe68.jpeg",
  },
  {
    id: "0217f83c-2ae5-4c14-904d-b20b1b847923",
    title: "At the Threshold",
    src: "/images/library/0217f83c-2ae5-4c14-904d-b20b1b847923.jpeg",
  },
  {
    id: "132643c5-130a-4903-aacb-8a67e8da1ef9",
    title: "Spiral Stairs",
    src: "/images/library/132643c5-130a-4903-aacb-8a67e8da1ef9.jpeg",
  },
  {
    id: "6aaa13ee-3d4b-4db0-9a16-cd3d06d0809b",
    title: "City Hall Reflection",
    src: "/images/library/6aaa13ee-3d4b-4db0-9a16-cd3d06d0809b.jpeg",
  },
  {
    id: "a712a140-ddde-4720-be0f-c4cf6d5eb3b2",
    title: "Two Sea Stacks",
    src: "/images/library/a712a140-ddde-4720-be0f-c4cf6d5eb3b2.jpeg",
  },
  {
    id: "7925ba61-68e8-4111-9330-7d44ac50675e",
    title: "Two in the Mist",
    src: "/images/library/7925ba61-68e8-4111-9330-7d44ac50675e.jpeg",
  },
  {
    id: "53e88c22-6bb9-4979-aa37-025cc4211e1f",
    title: "Fogbound Traffic",
    src: "/images/library/53e88c22-6bb9-4979-aa37-025cc4211e1f.jpeg",
  },
  {
    id: "0f66f5fa-3bf3-4bcd-b20b-fd1ab91fc2ba",
    title: "Red Tuk-Tuk in Fog",
    src: "/images/library/0f66f5fa-3bf3-4bcd-b20b-fd1ab91fc2ba.jpeg",
  },
  {
    id: "ca6189ff-4806-4df7-9835-7fb39579eb3f",
    title: "Kuala Lumpur",
    src: "/images/library/ca6189ff-4806-4df7-9835-7fb39579eb3f.jpg",
  },
  {
    id: "769bebdd-14bf-4a44-a4a3-18122f11c6f1",
    title: "Black Edge",
    src: "/images/library/769bebdd-14bf-4a44-a4a3-18122f11c6f1.jpg",
  },
  {
    id: "80d9e684-e052-485f-b9b0-46ad135e9fd4",
    title: "The Orb",
    src: "/images/library/80d9e684-e052-485f-b9b0-46ad135e9fd4.jpg",
  },
  {
    id: "313c6993-2523-4434-a977-63f3020745a4",
    title: "Incomplete",
    src: "/images/library/313c6993-2523-4434-a977-63f3020745a4.jpg",
  },
  {
    id: "3d033bf0-8b2b-4c9c-b481-74513aa75590",
    title: "Brand New Day",
    src: "/images/library/3d033bf0-8b2b-4c9c-b481-74513aa75590.jpg",
  },
];
