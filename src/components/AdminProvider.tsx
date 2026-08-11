"use client";

import type { Photo, PhotoCategory } from "@/data/photos";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";
import {
  FATNI_SITE_ID,
  getActiveSiteId,
  photoOrderInCategory,
} from "@/lib/photo-map";
import {
  planContiguousCollectionOrder,
  verifyPersistedPhotoOrder,
} from "@/lib/collection-order";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PendingUpload = {
  localId: string;
  file: File;
  title: string;
  categories: PhotoCategory[];
  previewUrl: string;
  displayScale: number;
};

export type PendingReplace = {
  photoId: string;
  file: File;
  previewUrl: string;
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
  /** Existing photo id → staged replacement file. */
  replaces: Record<string, PendingReplace>;
};

const emptyDraft = (): EditDraft => ({
  patches: {},
  orders: {},
  uploads: [],
  replaces: {},
});

function draftIsDirty(draft: EditDraft) {
  return (
    draft.uploads.length > 0 ||
    Object.keys(draft.orders).length > 0 ||
    Object.keys(draft.patches).length > 0 ||
    Object.keys(draft.replaces).length > 0
  );
}

function clampScale(n: number) {
  return Math.round(Math.min(3, Math.max(0.45, n)) * 100) / 100;
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
      const replace = p.id ? draft.replaces[p.id] : undefined;
      if (!p.id) {
        return { ...p, displayScale: clampScale(p.displayScale ?? 1) };
      }
      const patch = draft.patches[p.id];
      return {
        ...p,
        src: replace?.previewUrl ?? p.src,
        title: patch?.title ?? p.title,
        displayScale: clampScale(
          patch?.displayScale ?? p.displayScale ?? 1,
        ),
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
        displayScale: clampScale(u.displayScale),
        sortOrder: Number.MAX_SAFE_INTEGER,
      }),
    );

  const combined = [...patched, ...pending];
  const order = draft.orders[viewKey];
  if (!order?.length) {
    return combined.sort(
      (a, b) => photoOrderInCategory(a, viewKey) - photoOrderInCategory(b, viewKey),
    );
  }

  const keyOf = (p: Photo) => p.id || p.src;
  const byKey = new Map(combined.map((p) => [keyOf(p), p] as const));
  const ordered: Photo[] = [];
  const seen = new Set<string>();

  for (const key of order) {
    const photo = byKey.get(key);
    if (photo && !seen.has(key)) {
      ordered.push(photo);
      seen.add(key);
    }
  }
  // Never drop photos that weren't in the saved order list.
  for (const photo of combined) {
    const key = keyOf(photo);
    if (!seen.has(key)) {
      ordered.push(photo);
      seen.add(key);
    }
  }
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
  queueReplace: (photo: Photo, file: File) => string | null;
  refresh: () => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

function revokeUploads(uploads: PendingUpload[]) {
  for (const u of uploads) URL.revokeObjectURL(u.previewUrl);
}

function revokeReplaces(replaces: Record<string, PendingReplace>) {
  for (const r of Object.values(replaces)) URL.revokeObjectURL(r.previewUrl);
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
      revokeReplaces(prev.replaces);
      return emptyDraft();
    });
    setSaveError(null);
  }, []);

  const setEditing = useCallback(
    (value: boolean) => {
      if (!value && dirty) {
        const ok = window.confirm("Discard all unsaved edits?");
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
          [viewKey]: ordered.map((p) => p.id || p.src).filter(Boolean),
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

  const queueReplace = useCallback((photo: Photo, file: File) => {
    if (!photo.id) return "Missing photo id.";
    if (!file.type.startsWith("image/")) return "Please choose an image file.";
    const previewUrl = URL.createObjectURL(file);

    if (photo.id.startsWith("pending:")) {
      setDraft((d) => ({
        ...d,
        uploads: d.uploads.map((u) => {
          if (u.localId !== photo.id) return u;
          URL.revokeObjectURL(u.previewUrl);
          return { ...u, file, previewUrl };
        }),
      }));
      return null;
    }

    setDraft((d) => {
      const prev = d.replaces[photo.id!];
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return {
        ...d,
        replaces: {
          ...d.replaces,
          [photo.id!]: { photoId: photo.id!, file, previewUrl },
        },
      };
    });
    return null;
  }, []);

  const saveDraft = useCallback(async () => {
    if (!supabase || !user) return "Not signed in.";
    setSaving(true);
    setSaveError(null);

    try {
      const current = draft;
      const idMap = new Map<string, string>(); // pending localId → real id

      // 1. Uploads — master photos row (legacy fields) + Fatni collection membership
      for (const upload of current.uploads) {
        const ext = upload.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
        let insertedId: string | null = null;

        try {
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
          if (!inserted?.id) throw new Error("Upload insert returned no id.");
          insertedId = inserted.id;
          const photoId = inserted.id;

          // Membership in each target Fatni collection (UI uploads one room).
          for (const category of upload.categories) {
            const { data: collection, error: collectionError } = await supabase
              .from("collections")
              .select("id")
              .eq("site_id", FATNI_SITE_ID)
              .eq("title", category)
              .maybeSingle();
            if (collectionError) throw new Error(collectionError.message);
            if (!collection?.id) {
              throw new Error(
                `No Fatni collection found for “${category}”. Upload was rolled back.`,
              );
            }

            const { data: membershipMax, error: maxError } = await supabase
              .from("collection_photos")
              .select("sort_order")
              .eq("collection_id", collection.id)
              .order("sort_order", { ascending: false })
              .limit(1);
            if (maxError) throw new Error(maxError.message);
            const nextPos = (membershipMax?.[0]?.sort_order ?? -1) + 1;

            const { error: membershipError } = await supabase
              .from("collection_photos")
              .insert({
                collection_id: collection.id,
                photo_id: photoId,
                sort_order: nextPos,
              });
            if (membershipError) throw new Error(membershipError.message);
          }

          idMap.set(upload.localId, photoId);
        } catch (err) {
          // Do not leave storage/photo without collection membership.
          if (insertedId) {
            await supabase.from("photos").delete().eq("id", insertedId);
          }
          await supabase.storage.from("photos").remove([path]);
          throw err;
        }
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

      // 3. File replacements (keep same row / title / order)
      for (const replace of Object.values(current.replaces)) {
        if (current.patches[replace.photoId]?.deleted) continue;

        const { data: row } = await supabase
          .from("photos")
          .select("storage_path")
          .eq("id", replace.photoId)
          .maybeSingle();

        const ext = replace.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(path, replace.file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw new Error(uploadError.message);

        const {
          data: { publicUrl },
        } = supabase.storage.from("photos").getPublicUrl(path);

        const { error: updateError } = await supabase
          .from("photos")
          .update({
            storage_path: path,
            public_url: publicUrl,
          })
          .eq("id", replace.photoId);
        if (updateError) throw new Error(updateError.message);

        if (row?.storage_path && !row.storage_path.startsWith("images/")) {
          await supabase.storage.from("photos").remove([row.storage_path]);
        }
      }

      // 4. Title / scale patches
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

      // 5. Reorders — write exact visual order as contiguous collection_photos.sort_order
      //    on the active site (Fatni or Ayoub). Fail closed if reload verification fails.
      const activeSiteId = getActiveSiteId();
      for (const [viewKey, ids] of Object.entries(current.orders)) {
        const resolved = ids
          .map((id) => (id.startsWith("pending:") ? idMap.get(id) : id))
          .filter((id): id is string => Boolean(id));
        if (resolved.length === 0) continue;

        const { data: collection, error: collectionError } = await supabase
          .from("collections")
          .select("id")
          .eq("site_id", activeSiteId)
          .eq("title", viewKey)
          .maybeSingle();
        if (collectionError) throw new Error(collectionError.message);
        if (!collection?.id) {
          throw new Error(
            `No ${activeSiteId} collection found for “${viewKey}”. Reorder was not saved.`,
          );
        }

        const { count: membershipCount, error: countError } = await supabase
          .from("collection_photos")
          .select("photo_id", { count: "exact", head: true })
          .eq("collection_id", collection.id);
        if (countError) throw new Error(countError.message);
        if ((membershipCount ?? 0) !== resolved.length) {
          throw new Error(
            `Reorder for “${viewKey}” is incomplete (${resolved.length} shown, ${membershipCount ?? 0} memberships). Save aborted.`,
          );
        }

        const planned = planContiguousCollectionOrder(resolved);
        const writeResults = await Promise.all(
          planned.map((row) =>
            supabase
              .from("collection_photos")
              .update({ sort_order: row.sort_order })
              .eq("collection_id", collection.id)
              .eq("photo_id", row.photo_id)
              .select("photo_id"),
          ),
        );
        for (let i = 0; i < writeResults.length; i++) {
          const result = writeResults[i];
          if (result.error) throw new Error(result.error.message);
          if ((result.data?.length ?? 0) !== 1) {
            throw new Error(
              `Failed to update sort_order for photo ${planned[i].photo_id} in “${viewKey}”.`,
            );
          }
        }

        const { data: persistedRows, error: verifyError } = await supabase
          .from("collection_photos")
          .select("photo_id, sort_order")
          .eq("collection_id", collection.id)
          .order("sort_order", { ascending: true });
        if (verifyError) throw new Error(verifyError.message);

        const persistedIds = (persistedRows ?? []).map((r) =>
          String(r.photo_id),
        );
        const check = verifyPersistedPhotoOrder({
          submittedPhotoIds: resolved,
          persistedPhotoIdsInOrder: persistedIds,
          collectionLabel: viewKey,
        });
        if (!check.ok) {
          throw new Error(check.detail);
        }
      }

      revokeUploads(current.uploads);
      revokeReplaces(current.replaces);
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
      queueReplace,
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
      queueReplace,
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
