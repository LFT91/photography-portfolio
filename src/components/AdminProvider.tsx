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

export type PendingUpload = {
  localId: string;
  file: File;
  title: string;
  categories: PhotoCategory[];
  previewUrl: string;
  displayScale: number;
};

type PhotoPatch = {
  title?: string;
  displayScale?: number;
  deleted?: boolean;
};

export type EditDraft = {
  patches: Record<string, PhotoPatch>;
  /** Category / room key → ordered photo ids (server + pending localIds). */
  orders: Record<string, string[]>;
  uploads: PendingUpload[];
};

const emptyDraft = (): EditDraft => ({
  patches: {},
  orders: {},
  uploads: [],
});

function draftIsDirty(draft: EditDraft) {
  return (
    draft.uploads.length > 0 ||
    Object.keys(draft.orders).length > 0 ||
    Object.keys(draft.patches).length > 0
  );
}

function clampScale(n: number) {
  return Math.round(Math.min(1.35, Math.max(0.45, n)) * 100) / 100;
}

export function applyDraftToList(
  source: Photo[],
  viewKey: PhotoCategory,
  draft: EditDraft,
): Photo[] {
  const patched = source
    .filter((p) => {
      if (!p.id) return true;
      return !draft.patches[p.id]?.deleted;
    })
    .map((p) => {
      if (!p.id) return p;
      const patch = draft.patches[p.id];
      if (!patch) return p;
      return {
        ...p,
        title: patch.title ?? p.title,
        displayScale: patch.displayScale ?? p.displayScale,
      };
    });

  const pending = draft.uploads
    .filter((u) => u.categories.includes(viewKey))
    .map(
      (u): Photo => ({
        id: u.localId,
        src: u.previewUrl,
        title: u.title,
        categories: u.categories,
        displayScale: u.displayScale,
        sortOrder: Number.MAX_SAFE_INTEGER,
      }),
    );

  const combined = [...patched, ...pending];
  const order = draft.orders[viewKey];
  if (!order?.length) {
    return combined.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  const byId = new Map(
    combined.filter((p) => p.id).map((p) => [p.id!, p] as const),
  );
  const ordered: Photo[] = [];
  for (const id of order) {
    const photo = byId.get(id);
    if (photo) {
      ordered.push(photo);
      byId.delete(id);
    }
  }
  for (const photo of byId.values()) ordered.push(photo);
  return ordered;
}

type AdminContextValue = {
  ready: boolean;
  configured: boolean;
  user: User | null;
  editing: boolean;
  setEditing: (value: boolean) => void;
  draft: EditDraft;
  dirty: boolean;
  saving: boolean;
  saveError: string | null;
  signOut: () => Promise<void>;
  discardDraft: () => void;
  saveDraft: () => Promise<string | null>;
  setPhotoTitle: (photo: Photo, title: string) => void;
  setPhotoScale: (photo: Photo, scale: number) => void;
  markDeleted: (photo: Photo) => void;
  setViewOrder: (viewKey: PhotoCategory, ordered: Photo[]) => void;
  queueUpload: (file: File, categories: PhotoCategory[]) => string | null;
  refresh: () => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

function revokeUploads(uploads: PendingUpload[]) {
  for (const u of uploads) URL.revokeObjectURL(u.previewUrl);
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const configured = hasSupabaseEnv();
  const router = useRouter();
  const [ready, setReady] = useState(!configured);
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditingState] = useState(false);
  const [draft, setDraft] = useState<EditDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const supabase = useMemo(
    () => (configured ? createClient() : null),
    [configured],
  );

  const dirty = draftIsDirty(draft);

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
      if (data.user) setEditingState(true);
      setReady(true);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setEditingState(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const discardDraft = useCallback(() => {
    setDraft((prev) => {
      revokeUploads(prev.uploads);
      return emptyDraft();
    });
    setSaveError(null);
  }, []);

  const setEditing = useCallback(
    (value: boolean) => {
      if (!value && dirty) {
        const ok = window.confirm("Discard unsaved changes?");
        if (!ok) return;
        discardDraft();
      }
      if (!value) setSaveError(null);
      setEditingState(value);
    },
    [dirty, discardDraft],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    if (dirty) {
      const ok = window.confirm("Discard unsaved changes and sign out?");
      if (!ok) return;
      discardDraft();
    }
    await supabase.auth.signOut();
    setUser(null);
    setEditingState(false);
    router.refresh();
  }, [supabase, router, dirty, discardDraft]);

  const setPhotoTitle = useCallback((photo: Photo, title: string) => {
    if (!photo.id) return;
    if (photo.id.startsWith("pending:")) {
      setDraft((d) => ({
        ...d,
        uploads: d.uploads.map((u) =>
          u.localId === photo.id ? { ...u, title } : u,
        ),
      }));
      return;
    }
    setDraft((d) => ({
      ...d,
      patches: {
        ...d.patches,
        [photo.id!]: { ...d.patches[photo.id!], title },
      },
    }));
  }, []);

  const setPhotoScale = useCallback((photo: Photo, scale: number) => {
    if (!photo.id) return;
    const next = clampScale(scale);
    if (photo.id.startsWith("pending:")) {
      setDraft((d) => ({
        ...d,
        uploads: d.uploads.map((u) =>
          u.localId === photo.id ? { ...u, displayScale: next } : u,
        ),
      }));
      return;
    }
    setDraft((d) => ({
      ...d,
      patches: {
        ...d.patches,
        [photo.id!]: { ...d.patches[photo.id!], displayScale: next },
      },
    }));
  }, []);

  const markDeleted = useCallback((photo: Photo) => {
    if (!photo.id) return;
    if (photo.id.startsWith("pending:")) {
      setDraft((d) => {
        const doomed = d.uploads.find((u) => u.localId === photo.id);
        if (doomed) URL.revokeObjectURL(doomed.previewUrl);
        return {
          ...d,
          uploads: d.uploads.filter((u) => u.localId !== photo.id),
          orders: Object.fromEntries(
            Object.entries(d.orders).map(([key, ids]) => [
              key,
              ids.filter((id) => id !== photo.id),
            ]),
          ),
        };
      });
      return;
    }
    setDraft((d) => ({
      ...d,
      patches: {
        ...d.patches,
        [photo.id!]: { ...d.patches[photo.id!], deleted: true },
      },
      orders: Object.fromEntries(
        Object.entries(d.orders).map(([key, ids]) => [
          key,
          ids.filter((id) => id !== photo.id),
        ]),
      ),
    }));
  }, []);

  const setViewOrder = useCallback(
    (viewKey: PhotoCategory, ordered: Photo[]) => {
      setDraft((d) => ({
        ...d,
        orders: {
          ...d.orders,
          [viewKey]: ordered.map((p) => p.id!).filter(Boolean),
        },
      }));
    },
    [],
  );

  const queueUpload = useCallback(
    (file: File, cats: PhotoCategory[]) => {
      if (!file.type.startsWith("image/")) return "Please choose an image file.";
      if (!cats.length) return "Pick a room first.";
      const localId = `pending:${crypto.randomUUID()}`;
      const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      const previewUrl = URL.createObjectURL(file);
      setDraft((d) => {
        const upload: PendingUpload = {
          localId,
          file,
          title,
          categories: cats,
          previewUrl,
          displayScale: 1,
        };
        const nextOrders = { ...d.orders };
        for (const cat of cats) {
          const existing = nextOrders[cat];
          if (existing) nextOrders[cat] = [...existing, localId];
        }
        return {
          ...d,
          uploads: [...d.uploads, upload],
          orders: nextOrders,
        };
      });
      return null;
    },
    [],
  );

  const saveDraft = useCallback(async () => {
    if (!supabase || !user) return "Not signed in.";
    setSaving(true);
    setSaveError(null);

    try {
      const current = draft;
      const idMap = new Map<string, string>(); // pending localId → real id

      // 1. Uploads
      for (const upload of current.uploads) {
        const ext = upload.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

        const { data: existing } = await supabase
          .from("photos")
          .select("sort_order")
          .order("sort_order", { ascending: false })
          .limit(1);
        const maxSort = existing?.[0]?.sort_order ?? -1;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(path, upload.file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw new Error(uploadError.message);

        const {
          data: { publicUrl },
        } = supabase.storage.from("photos").getPublicUrl(path);

        const { data: inserted, error: insertError } = await supabase
          .from("photos")
          .insert({
            title: upload.title.trim() || "Untitled",
            storage_path: path,
            public_url: publicUrl,
            categories: upload.categories,
            night_kind: null,
            sort_order: maxSort + 1,
            display_scale: upload.displayScale,
          })
          .select("id")
          .single();
        if (insertError) throw new Error(insertError.message);
        if (inserted?.id) idMap.set(upload.localId, inserted.id);
      }

      // 2. Deletes
      for (const [id, patch] of Object.entries(current.patches)) {
        if (!patch.deleted) continue;
        const { data: row } = await supabase
          .from("photos")
          .select("storage_path")
          .eq("id", id)
          .maybeSingle();
        if (row?.storage_path && !row.storage_path.startsWith("images/")) {
          await supabase.storage.from("photos").remove([row.storage_path]);
        }
        const { error } = await supabase.from("photos").delete().eq("id", id);
        if (error) throw new Error(error.message);
      }

      // 3. Title / scale patches
      for (const [id, patch] of Object.entries(current.patches)) {
        if (patch.deleted) continue;
        const update: Record<string, unknown> = {};
        if (patch.title != null) update.title = patch.title.trim() || "Untitled";
        if (patch.displayScale != null) update.display_scale = patch.displayScale;
        if (!Object.keys(update).length) continue;
        const { error } = await supabase
          .from("photos")
          .update(update)
          .eq("id", id);
        if (error) throw new Error(error.message);
      }

      // 4. Reorders — resolve pending ids, permute existing sort_order values
      for (const ids of Object.values(current.orders)) {
        const resolved = ids
          .map((id) => (id.startsWith("pending:") ? idMap.get(id) : id))
          .filter((id): id is string => Boolean(id));
        if (resolved.length < 2) continue;

        const { data: rows, error: fetchError } = await supabase
          .from("photos")
          .select("id, sort_order")
          .in("id", resolved);
        if (fetchError) throw new Error(fetchError.message);

        const orderById = new Map(
          (rows ?? []).map((r) => [r.id as string, r.sort_order as number]),
        );
        const orders = resolved
          .map((id) => orderById.get(id))
          .filter((n): n is number => n != null)
          .sort((a, b) => a - b);

        if (orders.length !== resolved.length) continue;

        await Promise.all(
          resolved.map((id, i) =>
            supabase.from("photos").update({ sort_order: orders[i] }).eq("id", id),
          ),
        );
      }

      revokeUploads(current.uploads);
      setDraft(emptyDraft());
      refresh();
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setSaveError(message);
      return message;
    } finally {
      setSaving(false);
    }
  }, [supabase, user, draft, refresh]);

  const value = useMemo(
    () => ({
      ready,
      configured,
      user,
      editing: Boolean(user) && editing,
      setEditing,
      draft,
      dirty,
      saving,
      saveError,
      signOut,
      discardDraft,
      saveDraft,
      setPhotoTitle,
      setPhotoScale,
      markDeleted,
      setViewOrder,
      queueUpload,
      refresh,
    }),
    [
      ready,
      configured,
      user,
      editing,
      setEditing,
      draft,
      dirty,
      saving,
      saveError,
      signOut,
      discardDraft,
      saveDraft,
      setPhotoTitle,
      setPhotoScale,
      markDeleted,
      setViewOrder,
      queueUpload,
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
