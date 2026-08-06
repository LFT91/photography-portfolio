import { photos as staticPhotos, type Photo } from "@/data/photos";
import { mapDbPhoto, type DbPhoto } from "@/lib/photo-map";

/** Supabase is source of truth when populated; otherwise local catalog. */
export async function getPhotos(): Promise<Photo[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return staticPhotos;
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("photos")
      .select(
        "id, title, storage_path, public_url, categories, night_kind, sort_order",
      )
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      return staticPhotos;
    }

    return data.map((row) => mapDbPhoto(row as DbPhoto));
  } catch {
    return staticPhotos;
  }
}
