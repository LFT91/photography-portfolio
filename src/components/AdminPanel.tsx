"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  categories as workCategories,
  type Photo,
  type PhotoCategory,
} from "@/data/photos";
import { mapDbPhoto, type DbPhoto } from "@/lib/photo-map";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const ALL_CATEGORIES: PhotoCategory[] = [
  ...workCategories,
  "After Dark",
];

export function AdminPanel() {
  const configured = hasSupabaseEnv();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<PhotoCategory[]>([
    "Nature",
  ]);

  const supabase = useMemo(
    () => (configured ? createClient() : null),
    [configured],
  );

  const loadPhotos = useCallback(async () => {
    if (!supabase) return;
    const { data, error: loadError } = await supabase
      .from("photos")
      .select(
        "id, title, storage_path, public_url, categories, night_kind, sort_order",
      )
      .order("sort_order", { ascending: true });

    if (loadError) {
      setError(loadError.message);
      return;
    }
    setPhotos((data as DbPhoto[]).map(mapDbPhoto));
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user);
      if (data.user) await loadPhotos();
      setLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) void loadPhotos();
      else setPhotos([]);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadPhotos]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signError) setError(signError.message);
    setBusy(false);
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setPhotos([]);
  };

  const toggleCategory = (category: PhotoCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const uploadPhoto = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !user || !file || !title.trim() || !selectedCategories.length) {
      setError("Title, file, and at least one category are required.");
      return;
    }

    setBusy(true);
    setError(null);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const maxSort = photos.reduce(
      (max, p) => Math.max(max, p.sortOrder ?? 0),
      -1,
    );

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setBusy(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("photos").getPublicUrl(path);

    const { error: insertError } = await supabase.from("photos").insert({
      title: title.trim(),
      storage_path: path,
      public_url: publicUrl,
      categories: selectedCategories,
      night_kind: null,
      sort_order: maxSort + 1,
    });

    if (insertError) {
      setError(insertError.message);
      setBusy(false);
      return;
    }

    setTitle("");
    setFile(null);
    setSelectedCategories(["Nature"]);
    await loadPhotos();
    setBusy(false);
  };

  const removePhoto = async (photo: Photo) => {
    if (!supabase || !photo.id) return;
    if (!window.confirm(`Remove “${photo.title}”?`)) return;

    setBusy(true);
    setError(null);

    if (photo.storagePath) {
      await supabase.storage.from("photos").remove([photo.storagePath]);
    }
    const { error: deleteError } = await supabase
      .from("photos")
      .delete()
      .eq("id", photo.id);

    if (deleteError) setError(deleteError.message);
    else await loadPhotos();
    setBusy(false);
  };

  const movePhoto = async (index: number, direction: -1 | 1) => {
    if (!supabase) return;
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;

    const a = photos[index];
    const b = photos[target];
    if (!a.id || !b.id) return;

    setBusy(true);
    setError(null);

    const aOrder = a.sortOrder ?? index;
    const bOrder = b.sortOrder ?? target;

    const { error: e1 } = await supabase
      .from("photos")
      .update({ sort_order: bOrder })
      .eq("id", a.id);
    const { error: e2 } = await supabase
      .from("photos")
      .update({ sort_order: aOrder })
      .eq("id", b.id);

    if (e1 || e2) setError(e1?.message || e2?.message || "Reorder failed");
    else await loadPhotos();
    setBusy(false);
  };

  if (!configured) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        <h1 className="font-display text-4xl italic text-paper">Admin</h1>
        <p className="mt-4 font-brand text-paper-dim">
          Supabase is not configured yet. Add these to{" "}
          <code className="text-ember">.env.local</code>, run the SQL in{" "}
          <code className="text-ember">supabase/migrations/</code>, then restart
          the app:
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 font-brand text-sm text-paper-dim">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        </ul>
        <p className="mt-6 font-brand text-sm text-fog">
          Until then the public site uses the local photo catalog.
        </p>
        <Link
          href="/"
          className="mt-10 inline-block font-brand text-sm text-ember hover:underline"
        >
          ← Back to site
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center font-brand text-paper-dim">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-5 py-16">
        <h1 className="font-display text-4xl italic text-paper">Admin</h1>
        <p className="mt-3 font-brand text-sm text-paper-dim">
          Sign in with the email you created in Supabase Auth.
        </p>
        <form onSubmit={signIn} className="mt-10 space-y-5">
          <label className="block">
            <span className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border border-line bg-transparent px-4 py-3 font-brand text-paper outline-none focus:border-ember"
            />
          </label>
          <label className="block">
            <span className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
              Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border border-line bg-transparent px-4 py-3 font-brand text-paper outline-none focus:border-ember"
            />
          </label>
          {error ? (
            <p className="font-brand text-sm text-ember">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full border border-ember px-4 py-3 font-brand text-sm tracking-[0.08em] text-ember transition-colors hover:bg-ember/10 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl italic text-paper">Admin</h1>
          <p className="mt-2 font-brand text-sm text-paper-dim">{user.email}</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/work"
            className="font-brand text-sm text-fog hover:text-paper"
          >
            View site
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="font-brand text-sm text-ember hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>

      <form
        onSubmit={uploadPhoto}
        className="mt-12 space-y-5 border border-line p-6 sm:p-8"
      >
        <h2 className="font-display text-2xl italic text-paper">Upload</h2>
        <label className="block">
          <span className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
            Title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-2 w-full border border-line bg-transparent px-4 py-3 font-brand text-paper outline-none focus:border-ember"
          />
        </label>
        <label className="block">
          <span className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
            Image
          </span>
          <input
            type="file"
            accept="image/*"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-2 w-full font-brand text-sm text-paper-dim file:mr-4 file:border file:border-line file:bg-transparent file:px-3 file:py-2 file:text-paper"
          />
        </label>
        <fieldset>
          <legend className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
            Categories
          </legend>
          <div className="mt-3 flex flex-wrap gap-4">
            {ALL_CATEGORIES.map((category) => (
              <label
                key={category}
                className="flex items-center gap-2 font-brand text-sm text-paper"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => toggleCategory(category)}
                />
                {category}
              </label>
            ))}
          </div>
        </fieldset>
        {error ? (
          <p className="font-brand text-sm text-ember">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="border border-ember px-6 py-3 font-brand text-sm tracking-[0.08em] text-ember transition-colors hover:bg-ember/10 disabled:opacity-50"
        >
          {busy ? "Working…" : "Upload photo"}
        </button>
      </form>

      <div className="mt-14">
        <h2 className="font-display text-2xl italic text-paper">
          Library ({photos.length})
        </h2>
        <p className="mt-2 font-brand text-sm text-fog">
          Use ↑ ↓ to reorder across Nature, Urban, Astro, Street, Monochrome, and After Dark.
        </p>
        <ul className="mt-8 space-y-4">
          {photos.map((photo, index) => (
            <li
              key={photo.id ?? photo.src}
              className="flex flex-wrap items-center gap-4 border border-line p-3 sm:flex-nowrap"
            >
              <div className="relative h-20 w-28 shrink-0 overflow-hidden bg-black">
                <Image
                  src={photo.src}
                  alt={photo.title}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-brand text-paper">{photo.title}</p>
                <p className="mt-1 font-brand text-xs text-fog">
                  {photo.categories.join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy || index === 0}
                  onClick={() => void movePhoto(index, -1)}
                  className="border border-line px-3 py-2 font-brand text-sm text-paper disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={busy || index === photos.length - 1}
                  onClick={() => void movePhoto(index, 1)}
                  className="border border-line px-3 py-2 font-brand text-sm text-paper disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void removePhoto(photo)}
                  className="border border-line px-3 py-2 font-brand text-sm text-ember disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
