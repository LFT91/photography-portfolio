"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";
import type { Photo, PhotoCategory } from "@/data/photos";

type AdminContextValue = {
  ready: boolean;
  configured: boolean;
  user: User | null;
  editing: boolean;
  setEditing: (value: boolean) => void;
  signOut: () => Promise<void>;
  uploadPhoto: (file: File, title: string, categories: PhotoCategory[]) => Promise<string | null>;
  removePhoto: (photo: Photo) => Promise<string | null>;
  movePhoto: (a: Photo, b: Photo) => Promise<string | null>;
  refresh: () => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const configured = hasSupabaseEnv();
  const router = useRouter();
  const [ready, setReady] = useState(!configured);
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);

  const supabase = useMemo(
    () => (configured ? createClient() : null),
    [configured],
  );

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }

    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user);
      if (data.user) setEditing(true);
      setReady(true);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setEditing(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setEditing(false);
    router.refresh();
  }, [supabase, router]);

  const uploadPhoto = useCallback(
    async (file: File, title: string, categories: PhotoCategory[]) => {
      if (!supabase || !user) return "Not signed in.";
      if (!title.trim() || !categories.length) {
        return "Title and at least one category are required.";
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { data: existing } = await supabase
        .from("photos")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1);

      const maxSort = existing?.[0]?.sort_order ?? -1;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) return uploadError.message;

      const {
        data: { publicUrl },
      } = supabase.storage.from("photos").getPublicUrl(path);

      const { error: insertError } = await supabase.from("photos").insert({
        title: title.trim(),
        storage_path: path,
        public_url: publicUrl,
        categories,
        night_kind: null,
        sort_order: maxSort + 1,
      });
      if (insertError) return insertError.message;

      refresh();
      return null;
    },
    [supabase, user, refresh],
  );

  const removePhoto = useCallback(
    async (photo: Photo) => {
      if (!supabase || !photo.id) return "Missing photo id.";
      if (photo.storagePath && !photo.storagePath.startsWith("images/")) {
        await supabase.storage.from("photos").remove([photo.storagePath]);
      }
      // Also try path as stored for vercel-seeded rows (images/...)
      const { error } = await supabase.from("photos").delete().eq("id", photo.id);
      if (error) return error.message;
      refresh();
      return null;
    },
    [supabase, refresh],
  );

  const movePhoto = useCallback(
    async (a: Photo, b: Photo) => {
      if (!supabase || !a.id || !b.id) return "Missing photo id.";
      const aOrder = a.sortOrder ?? 0;
      const bOrder = b.sortOrder ?? 0;
      const { error: e1 } = await supabase
        .from("photos")
        .update({ sort_order: bOrder })
        .eq("id", a.id);
      const { error: e2 } = await supabase
        .from("photos")
        .update({ sort_order: aOrder })
        .eq("id", b.id);
      if (e1 || e2) return e1?.message || e2?.message || "Reorder failed";
      refresh();
      return null;
    },
    [supabase, refresh],
  );

  const value = useMemo(
    () => ({
      ready,
      configured,
      user,
      editing: Boolean(user) && editing,
      setEditing,
      signOut,
      uploadPhoto,
      removePhoto,
      movePhoto,
      refresh,
    }),
    [
      ready,
      configured,
      user,
      editing,
      signOut,
      uploadPhoto,
      removePhoto,
      movePhoto,
      refresh,
    ],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return ctx;
}
