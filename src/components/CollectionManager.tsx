"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/components/AdminProvider";
import { ProtectedImage } from "@/components/ProtectedImage";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";

type SiteRow = { id: string; name: string };
type CollectionRow = {
  id: string;
  title: string;
  slug: string;
  sort_order: number;
};
type LibraryPhoto = {
  id: string;
  title: string;
  public_url: string;
};
type MemberPhoto = LibraryPhoto & { sort_order: number };

export function CollectionManager() {
  const { ready, user } = useAdmin();
  const router = useRouter();
  const configured = hasSupabaseEnv();
  const supabase = useMemo(
    () => (configured ? createClient() : null),
    [configured],
  );

  const [sites, setSites] = useState<SiteRow[]>([]);
  const [siteId, setSiteId] = useState<string>("");
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [collectionId, setCollectionId] = useState<string>("");
  const [members, setMembers] = useState<MemberPhoto[]>([]);
  const [library, setLibrary] = useState<LibraryPhoto[]>([]);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/admin");
  }, [ready, user, router]);

  const loadMembers = useCallback(
    async (targetCollectionId: string) => {
      if (!supabase || !targetCollectionId) {
        setMembers([]);
        return;
      }
      const { data, error: err } = await supabase
        .from("collection_photos")
        .select("sort_order, photo:photos ( id, title, public_url )")
        .eq("collection_id", targetCollectionId)
        .order("sort_order", { ascending: true });
      if (err) throw new Error(err.message);

      const next: MemberPhoto[] = [];
      for (const row of data ?? []) {
        const raw = row.photo as
          | LibraryPhoto
          | LibraryPhoto[]
          | null
          | undefined;
        const photo = Array.isArray(raw) ? raw[0] : raw;
        if (!photo?.id) continue;
        next.push({
          id: photo.id,
          title: photo.title,
          public_url: photo.public_url,
          sort_order: row.sort_order as number,
        });
      }
      setMembers(next);
    },
    [supabase],
  );

  // Initial load: sites + master library
  useEffect(() => {
    if (!ready || !user || !supabase) return;
    let cancelled = false;
    (async () => {
      setBooting(true);
      setError(null);
      try {
        const [sitesRes, libraryRes] = await Promise.all([
          supabase.from("sites").select("id, name").order("name", {
            ascending: true,
          }),
          supabase
            .from("photos")
            .select("id, title, public_url")
            .order("title", { ascending: true }),
        ]);
        if (sitesRes.error) throw new Error(sitesRes.error.message);
        if (libraryRes.error) throw new Error(libraryRes.error.message);
        if (cancelled) return;
        const siteRows = sitesRes.data ?? [];
        setSites(siteRows);
        setLibrary(libraryRes.data ?? []);
        setSiteId((prev) => prev || siteRows[0]?.id || "");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load.");
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, user, supabase]);

  // When site changes: load its collections
  useEffect(() => {
    if (!supabase || !siteId) {
      setCollections([]);
      setCollectionId("");
      return;
    }
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from("collections")
          .select("id, title, slug, sort_order")
          .eq("site_id", siteId)
          .order("sort_order", { ascending: true });
        if (err) throw new Error(err.message);
        if (cancelled) return;
        const rows = data ?? [];
        setCollections(rows);
        setCollectionId((prev) =>
          rows.some((c) => c.id === prev) ? prev : (rows[0]?.id ?? ""),
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load collections.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, siteId]);

  // When collection changes: load membership
  useEffect(() => {
    if (!collectionId) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setError(null);
      setStatus(null);
      try {
        await loadMembers(collectionId);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load members.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collectionId, loadMembers]);

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.id)),
    [members],
  );

  const addable = useMemo(() => {
    const q = libraryQuery.trim().toLowerCase();
    return library.filter((p) => {
      if (memberIds.has(p.id)) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q);
    });
  }, [library, memberIds, libraryQuery]);

  const persistOrder = async (ordered: MemberPhoto[]) => {
    if (!supabase || !collectionId) return;
    const ranks = ordered
      .map((m) => m.sort_order)
      .slice()
      .sort((a, b) => a - b);
    if (ranks.length !== ordered.length) return;

    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const results = await Promise.all(
        ordered.map((photo, i) =>
          supabase
            .from("collection_photos")
            .update({ sort_order: ranks[i] })
            .eq("collection_id", collectionId)
            .eq("photo_id", photo.id),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw new Error(failed.error.message);
      setMembers(
        ordered.map((photo, i) => ({ ...photo, sort_order: ranks[i] })),
      );
      setStatus("Order saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed.");
      await loadMembers(collectionId);
    } finally {
      setBusy(false);
    }
  };

  const moveMember = async (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= members.length) return;
    const next = [...members];
    const tmp = next[index];
    next[index] = next[to];
    next[to] = tmp;
    await persistOrder(next);
  };

  const addPhoto = async (photo: LibraryPhoto) => {
    if (!supabase || !collectionId) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const { data: maxRows, error: maxError } = await supabase
        .from("collection_photos")
        .select("sort_order")
        .eq("collection_id", collectionId)
        .order("sort_order", { ascending: false })
        .limit(1);
      if (maxError) throw new Error(maxError.message);
      const nextPos = (maxRows?.[0]?.sort_order ?? -1) + 1;

      const { error: insertError } = await supabase
        .from("collection_photos")
        .insert({
          collection_id: collectionId,
          photo_id: photo.id,
          sort_order: nextPos,
        });
      if (insertError) throw new Error(insertError.message);

      setStatus(`Added “${photo.title}”.`);
      await loadMembers(collectionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed.");
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async (photo: MemberPhoto) => {
    if (!supabase || !collectionId) return;
    if (
      !window.confirm(
        `Remove “${photo.title}” from this collection? The master photo stays in the library.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const { error: deleteError } = await supabase
        .from("collection_photos")
        .delete()
        .eq("collection_id", collectionId)
        .eq("photo_id", photo.id);
      if (deleteError) throw new Error(deleteError.message);
      setStatus(`Removed “${photo.title}” from collection.`);
      await loadMembers(collectionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <h1 className="font-display text-4xl italic text-paper">
          Collection Manager
        </h1>
        <p className="mt-4 font-brand text-paper-dim">
          Supabase is not configured.
        </p>
      </div>
    );
  }

  if (!ready || !user || booting) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center font-brand text-paper-dim">
        Checking session…
      </div>
    );
  }

  const activeCollection = collections.find((c) => c.id === collectionId);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-brand text-xs tracking-[0.14em] text-ember uppercase">
            Admin
          </p>
          <h1 className="mt-2 font-display text-4xl italic text-paper sm:text-5xl">
            Collection Manager
          </h1>
          <p className="mt-3 max-w-2xl font-brand text-sm leading-relaxed text-paper/80 sm:text-base">
            Assign master-library photos to a site collection, remove membership
            without deleting files, and reorder with independent collection sort
            order.
          </p>
        </div>
        <Link
          href="/work"
          className="border border-line px-4 py-2 font-brand text-sm text-paper-dim transition-colors hover:text-paper"
        >
          ← Back to site
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
            Site
          </span>
          <select
            value={siteId}
            disabled={busy}
            onChange={(e) => setSiteId(e.target.value)}
            className="mt-2 w-full border border-line bg-ink px-4 py-3 font-brand text-paper outline-none focus:border-ember"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
            Collection
          </span>
          <select
            value={collectionId}
            disabled={busy || !collections.length}
            onChange={(e) => setCollectionId(e.target.value)}
            className="mt-2 w-full border border-line bg-ink px-4 py-3 font-brand text-paper outline-none focus:border-ember"
          >
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p className="mt-4 font-brand text-sm text-ember">{error}</p>
      ) : null}
      {status ? (
        <p className="mt-4 font-brand text-sm text-paper/80">{status}</p>
      ) : null}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="font-brand text-lg tracking-[0.04em] text-paper">
              In collection
              {activeCollection ? ` · ${activeCollection.title}` : ""}
            </h2>
            <p className="font-brand text-sm text-fog tabular-nums">
              {members.length} photo{members.length === 1 ? "" : "s"}
            </p>
          </div>

          {!collectionId ? (
            <p className="font-brand text-paper-dim">Select a collection.</p>
          ) : members.length === 0 ? (
            <p className="font-brand text-paper-dim">
              This collection is empty. Add photos from the library.
            </p>
          ) : (
            <ul className="space-y-3">
              {members.map((photo, index) => (
                <li
                  key={photo.id}
                  className="flex items-center gap-3 border border-line bg-ink-soft/40 p-2 sm:gap-4 sm:p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-ink sm:h-20 sm:w-20">
                    <ProtectedImage
                      src={photo.public_url}
                      alt={photo.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg italic text-paper">
                      {photo.title}
                    </p>
                    <p className="mt-0.5 font-brand text-xs tracking-[0.08em] text-fog tabular-nums">
                      #{index + 1} · sort {photo.sort_order}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                    <button
                      type="button"
                      disabled={busy || index === 0}
                      onClick={() => void moveMember(index, -1)}
                      className="border border-line px-2 py-1 font-brand text-sm text-paper-dim transition-colors hover:text-paper disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={busy || index === members.length - 1}
                      onClick={() => void moveMember(index, 1)}
                      className="border border-line px-2 py-1 font-brand text-sm text-paper-dim transition-colors hover:text-paper disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removePhoto(photo)}
                      className="border border-line px-2 py-1 font-brand text-sm text-ember transition-colors hover:bg-ember/10 disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-brand text-lg tracking-[0.04em] text-paper">
              Add from library
            </h2>
            <p className="font-brand text-sm text-fog tabular-nums">
              {addable.length} available
            </p>
          </div>
          <input
            type="search"
            value={libraryQuery}
            onChange={(e) => setLibraryQuery(e.target.value)}
            placeholder="Search by title"
            className="mb-4 w-full border border-line bg-transparent px-4 py-3 font-brand text-paper outline-none placeholder:text-fog focus:border-ember"
          />
          {!collectionId ? (
            <p className="font-brand text-paper-dim">Select a collection first.</p>
          ) : addable.length === 0 ? (
            <p className="font-brand text-paper-dim">
              No matching library photos to add.
            </p>
          ) : (
            <ul className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
              {addable.map((photo) => (
                <li
                  key={photo.id}
                  className="flex items-center gap-3 border border-line/80 p-2"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-ink">
                    <ProtectedImage
                      src={photo.public_url}
                      alt={photo.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <p className="min-w-0 flex-1 truncate font-brand text-sm text-paper">
                    {photo.title}
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void addPhoto(photo)}
                    className="shrink-0 border border-ember px-3 py-1.5 font-brand text-sm text-ember transition-colors hover:bg-ember/10 disabled:opacity-40"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
