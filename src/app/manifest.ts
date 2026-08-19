import type { MetadataRoute } from "next";
import { getActiveSite, isAyoubSite } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  const site = getActiveSite();

  return {
    name: site.name,
    short_name: isAyoubSite() ? "Ayoub" : "Fatni",
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0b0c0e",
    theme_color: "#0b0c0e",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
