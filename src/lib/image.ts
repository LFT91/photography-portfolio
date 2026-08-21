import manifest from "@/data/image-manifest.json";

export const TILE_WIDTH = 800;
export const DISPLAY_WIDTH = 1800;

export type ImageVariant = {
  src: string;
  width?: number;
  height?: number;
};

export type ImageVariants = {
  tile: ImageVariant;
  display: ImageVariant;
  hero?: ImageVariant;
};

type ManifestEntry = {
  width: number;
  height: number;
  display: { src: string; width: number; height: number };
  tile: { src: string; width: number; height: number };
  hero?: { src: string; width: number; height: number };
};

const IMAGE_MANIFEST = manifest as Record<string, ManifestEntry>;

const LOCAL_PREFIXES = [
  "https://www.fatniphotography.com",
  "https://fatniphotography.com",
  "https://fatni-photography.vercel.app",
];

export function localImagePath(src: string): string | null {
  if (!src) return null;
  if (src.startsWith("/images/")) return src.split("?")[0];

  try {
    const url = new URL(src);
    if (!url.pathname.startsWith("/images/")) return null;
    if (
      LOCAL_PREFIXES.includes(url.origin) ||
      url.hostname.endsWith(".vercel.app")
    ) {
      return url.pathname.split("?")[0];
    }
  } catch {
    const index = src.indexOf("/images/");
    if (index >= 0) return src.slice(index).split("?")[0];
  }

  return null;
}

export function supabaseObjectPath(src: string): string | null {
  try {
    const url = new URL(src);
    if (!url.hostname.endsWith(".supabase.co")) return null;
    const marker = "/storage/v1/object/public/";
    const index = url.pathname.indexOf(marker);
    if (index < 0) return null;
    return url.pathname.slice(index + marker.length);
  } catch {
    return null;
  }
}

export function supabaseRenderUrl(src: string, width: number): string | null {
  try {
    const url = new URL(src);
    if (!url.hostname.endsWith(".supabase.co")) return null;

    const objectMarker = "/storage/v1/object/public/";
    const renderMarker = "/storage/v1/render/image/public/";
    let rest: string | null = null;

    if (url.pathname.includes(objectMarker)) {
      rest = url.pathname.slice(
        url.pathname.indexOf(objectMarker) + objectMarker.length,
      );
    } else if (url.pathname.includes(renderMarker)) {
      rest = url.pathname.slice(
        url.pathname.indexOf(renderMarker) + renderMarker.length,
      );
    }

    if (!rest) return null;

    url.pathname = `${renderMarker}${rest}`;
    url.search = "";
    url.searchParams.set("width", String(width));
    url.searchParams.set("resize", "contain");
    url.searchParams.set("quality", width <= TILE_WIDTH ? "75" : "80");
    return url.toString();
  } catch {
    return null;
  }
}

function manifestEntry(src: string): ManifestEntry | null {
  const local = localImagePath(src);
  if (!local) return null;
  return IMAGE_MANIFEST[local] ?? null;
}

export function variantsFor(src: string): ImageVariants {
  if (src.startsWith("blob:") || src.startsWith("data:")) {
    return { tile: { src }, display: { src } };
  }

  const entry = manifestEntry(src);
  if (entry) {
    return {
      tile: entry.tile,
      display: entry.display,
      hero: entry.hero,
    };
  }

  const tile = supabaseRenderUrl(src, TILE_WIDTH);
  const display = supabaseRenderUrl(src, DISPLAY_WIDTH);
  if (tile && display) {
    return { tile: { src: tile }, display: { src: display } };
  }

  return { tile: { src }, display: { src } };
}

export function heroImage(): ImageVariant {
  const entry = IMAGE_MANIFEST["/images/after-dark/startrails.jpg"];
  if (entry?.hero) return entry.hero;
  return variantsFor("/images/after-dark/startrails.jpg").display;
}

export function absoluteImageUrl(src: string, origin: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${origin.replace(/\/$/, "")}${src.startsWith("/") ? src : `/${src}`}`;
}
