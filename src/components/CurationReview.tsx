"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useAdmin } from "@/components/AdminProvider";
import { CurationProposalReview } from "@/components/CurationProposalReview";
import { ProtectedImage } from "@/components/ProtectedImage";
import {
  filterCurationPhotos,
  parseCurationFilter,
  summarizeCuration,
  toManifestEntry,
  isRetiredCollection,
  type CurationFilter,
  type CurationPhoto,
} from "@/lib/curation";
import type {
  CollectionOption,
  SiteOption,
} from "@/lib/curation-data";
import type { MembershipIdentitySchemaInfo } from "@/lib/curation-dry-run";

const FILTERS: { id: CurationFilter; label: string; countKey: keyof ReturnType<typeof summarizeCuration> }[] = [
  { id: "all", label: "All", countKey: "all" },
  { id: "unassigned", label: "Unassigned", countKey: "unassigned" },
  { id: "assigned_once", label: "Assigned once", countKey: "assignedOnce" },
  { id: "duplicate", label: "Duplicate", countKey: "duplicate" },
  { id: "cross_site", label: "Cross-site duplicate", countKey: "crossSiteDuplicate" },
  { id: "retired", label: "Retired/invalid", countKey: "retired" },
  { id: "needs_title", label: "Needs title", countKey: "needsTitle" },
];

function siteLabel(siteId: string, sites: SiteOption[]) {
  return sites.find((s) => s.id === siteId)?.name ?? siteId;
}

function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? `Copied UUID ${id}` : `Copy UUID ${id}`}
      onClick={() => {
        void navigator.clipboard.writeText(id).then(
          () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          },
          () => {
            /* Clipboard can reject when the document is not focused. */
          },
        );
      }}
      className="shrink-0 border border-line px-2 py-0.5 font-brand text-[11px] tracking-[0.06em] text-paper-dim transition-colors hover:text-paper"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Badges({ photo }: { photo: CurationPhoto }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {photo.allocationState === "unassigned" ? (
        <span className="border border-line px-1.5 py-0.5 font-brand text-[10px] tracking-[0.08em] text-fog uppercase">
          Unassigned
        </span>
      ) : null}
      {photo.allocationState === "assigned_once" ? (
        <span className="border border-line px-1.5 py-0.5 font-brand text-[10px] tracking-[0.08em] text-paper/70 uppercase">
          Assigned once
        </span>
      ) : null}
      {photo.allocationState === "duplicate" ? (
        <span className="border border-ember/60 px-1.5 py-0.5 font-brand text-[10px] tracking-[0.08em] text-ember uppercase">
          Duplicate
        </span>
      ) : null}
      {photo.crossSiteDuplicate ? (
        <span className="border border-ember/60 px-1.5 py-0.5 font-brand text-[10px] tracking-[0.08em] text-ember uppercase">
          Cross-site
        </span>
      ) : null}
      {photo.retiredMembership ? (
        <span className="border border-paper/30 px-1.5 py-0.5 font-brand text-[10px] tracking-[0.08em] text-paper/55 uppercase">
          Retired/invalid
        </span>
      ) : null}
      {photo.needsTitle ? (
        <span className="border border-line px-1.5 py-0.5 font-brand text-[10px] tracking-[0.08em] text-fog uppercase">
          Needs title
        </span>
      ) : null}
    </div>
  );
}

function MembershipList({
  photo,
  sites,
  dense,
}: {
  photo: CurationPhoto;
  sites: SiteOption[];
  dense?: boolean;
}) {
  if (!photo.memberships.length) {
    return (
      <p className={`font-brand text-fog ${dense ? "text-xs" : "text-sm"}`}>
        No collection memberships
      </p>
    );
  }
  return (
    <ul className={`space-y-1 ${dense ? "text-xs" : "text-sm"}`}>
      {photo.memberships.map((m) => (
        <li key={`${m.collectionId}-${m.sortOrder}`} className="font-brand text-paper/80">
          <span className="text-paper">{siteLabel(m.siteId, sites)}</span>
          {" · "}
          {m.title}
          <span className="text-fog"> ({m.slug})</span>
          <span className="tabular-nums text-fog"> · sort {m.sortOrder}</span>
          {m.retired ? (
            <span className="ml-1 text-ember/80">· retired</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function PhotoLightboxImage({
  photo,
  priority,
}: {
  photo: CurationPhoto;
  priority?: boolean;
}) {
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const loaded = loadedId === photo.id;

  return (
    <div className="relative min-h-[40vh] bg-ink-soft lg:min-h-[70vh]">
      {!loaded ? (
        <div
          className="absolute inset-0 z-[1] flex items-center justify-center bg-ink-soft"
          aria-live="polite"
        >
          <p className="font-brand text-sm text-fog">Loading image…</p>
        </div>
      ) : null}
      <ProtectedImage
        key={photo.id}
        src={photo.publicUrl}
        alt={photo.title || "Photograph"}
        fill
        sizes="(max-width: 1024px) 100vw, 60vw"
        className={`object-contain transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
        priority={priority}
        onLoad={() => setLoadedId(photo.id)}
      />
    </div>
  );
}

type Props = {
  photos: CurationPhoto[];
  sites: SiteOption[];
  collections: CollectionOption[];
  loadError: string | null;
  /** Vercel preview for feature/curation-review only — no admin session required. */
  readOnlyPreview?: boolean;
  membershipIdentitySchema?: MembershipIdentitySchemaInfo | null;
};

export function CurationReview({
  photos,
  sites,
  collections,
  loadError,
  readOnlyPreview = false,
  membershipIdentitySchema = null,
}: Props) {
  const { ready, user } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") === "proposals" ? "proposals" : "audit";
  const filter = parseCurationFilter(searchParams.get("filter"));
  const siteId = searchParams.get("site");
  const collectionId = searchParams.get("collection");
  const selectedId = searchParams.get("photo");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openTriggerRef = useRef<HTMLElement | null>(null);

  const summary = useMemo(() => summarizeCuration(photos), [photos]);

  const filtered = useMemo(
    () =>
      filterCurationPhotos(photos, {
        filter,
        siteId,
        collectionId,
      }),
    [photos, filter, siteId, collectionId],
  );

  const selectedIndex = useMemo(() => {
    if (!selectedId) return -1;
    return filtered.findIndex((p) => p.id === selectedId);
  }, [filtered, selectedId]);

  const selected =
    selectedIndex >= 0 ? filtered[selectedIndex] : null;

  const collectionsForSite = useMemo(() => {
    if (!siteId) return collections;
    return collections.filter((c) => c.siteId === siteId);
  }, [collections, siteId]);

  const replaceQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (readOnlyPreview) return;
    if (!ready) return;
    if (!user) router.replace("/admin");
  }, [readOnlyPreview, ready, user, router]);

  // Drop selected photo from URL if it falls outside the active filter.
  useEffect(() => {
    if (!selectedId) return;
    if (filtered.some((p) => p.id === selectedId)) return;
    replaceQuery({ photo: null });
  }, [filtered, selectedId, replaceQuery]);

  // If collection belongs to another site after site change, clear it.
  useEffect(() => {
    if (!collectionId || !siteId) return;
    const col = collections.find((c) => c.id === collectionId);
    if (col && col.siteId !== siteId) {
      replaceQuery({ collection: null });
    }
  }, [collectionId, siteId, collections, replaceQuery]);

  const openPhoto = useCallback(
    (id: string, trigger?: HTMLElement | null) => {
      if (trigger) openTriggerRef.current = trigger;
      replaceQuery({ photo: id });
    },
    [replaceQuery],
  );
  const closePhoto = useCallback(() => {
    replaceQuery({ photo: null });
    queueMicrotask(() => openTriggerRef.current?.focus());
  }, [replaceQuery]);

  useEffect(() => {
    if (!selectedId || !selected) return;
    queueMicrotask(() => closeButtonRef.current?.focus());
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps -- focus only when opened photo changes


  const goRelative = useCallback(
    (delta: number) => {
      if (selectedIndex < 0 || filtered.length === 0) return;
      const next =
        (selectedIndex + delta + filtered.length) % filtered.length;
      replaceQuery({ photo: filtered[next].id });
    },
    [filtered, selectedIndex, replaceQuery],
  );

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") closePhoto();
      if (e.key === "ArrowLeft") goRelative(-1);
      if (e.key === "ArrowRight") goRelative(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, closePhoto, goRelative]);

  const exportManifest = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      filter: {
        filter,
        site: siteId,
        collection: collectionId,
      },
      count: filtered.length,
      photos: filtered.map(toManifestEntry),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curation-manifest-${filter}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!readOnlyPreview && (!ready || !user)) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center font-brand text-paper-dim">
        Checking session…
      </div>
    );
  }

  if (mode === "proposals") {
    return (
      <CurationProposalReview
        photos={photos}
        sites={sites}
        collections={collections}
        readOnlyPreview={readOnlyPreview}
        membershipIdentitySchema={membershipIdentitySchema}
        onSwitchToAudit={() => {
          router.replace(pathname, { scroll: false });
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-12 sm:px-8 sm:py-16">
      {readOnlyPreview ? (
        <p
          role="status"
          className="mb-6 border border-ember/50 bg-ember/10 px-4 py-3 font-brand text-sm tracking-[0.04em] text-ember"
        >
          Read-only preview — unauthenticated access on this Vercel preview
          branch only. No edits.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-brand text-xs tracking-[0.14em] text-ember uppercase">
            {readOnlyPreview ? "Read-only preview" : "Admin · read-only"}
          </p>
          <h1 className="mt-2 font-display text-4xl italic text-paper sm:text-5xl">
            Curation review
          </h1>
          <p className="mt-3 max-w-2xl font-brand text-sm leading-relaxed text-paper/80 sm:text-base">
            Master library audit. Membership comes only from{" "}
            <code className="text-ember/90">collection_photos</code>. No edits
            in this phase.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => replaceQuery({ mode: "proposals", filter: null, site: null, collection: null, photo: null })}
            className="border border-ember px-4 py-2 font-brand text-sm tracking-[0.06em] text-ember transition-colors hover:bg-ember/10"
          >
            Proposal review
          </button>
          <button
            type="button"
            onClick={exportManifest}
            className="border border-line px-4 py-2 font-brand text-sm tracking-[0.06em] text-paper-dim transition-colors hover:text-paper"
          >
            Export current manifest
          </button>
          {!readOnlyPreview ? (
            <Link
              href="/admin/collections"
              className="border border-line px-4 py-2 font-brand text-sm text-paper-dim transition-colors hover:text-paper"
            >
              Collections
            </Link>
          ) : null}
        </div>
      </div>

      {loadError ? (
        <p className="mt-6 font-brand text-sm text-ember">{loadError}</p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const count = summary[f.countKey];
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => replaceQuery({ filter: f.id === "all" ? null : f.id, photo: null })}
              className={`border px-3 py-1.5 font-brand text-sm transition-colors ${
                active
                  ? "border-ember text-ember"
                  : "border-line text-paper-dim hover:text-paper"
              }`}
            >
              {f.label}
              <span className="ml-2 tabular-nums text-fog">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
            Current site
          </span>
          <select
            value={siteId ?? ""}
            onChange={(e) =>
              replaceQuery({
                site: e.target.value || null,
                collection: null,
                photo: null,
              })
            }
            className="mt-2 w-full border border-line bg-ink px-3 py-2.5 font-brand text-sm text-paper outline-none focus:border-ember"
          >
            <option value="">Any site</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
            Current collection
          </span>
          <select
            value={collectionId ?? ""}
            onChange={(e) =>
              replaceQuery({
                collection: e.target.value || null,
                photo: null,
              })
            }
            className="mt-2 w-full border border-line bg-ink px-3 py-2.5 font-brand text-sm text-paper outline-none focus:border-ember"
          >
            <option value="">Any collection</option>
            {collectionsForSite.map((c) => (
              <option key={c.id} value={c.id}>
                {siteLabel(c.siteId, sites)} · {c.title}
                {isRetiredCollection(c.siteId, c.slug) ? " (retired)" : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <p className="font-brand text-sm text-fog tabular-nums">
            Showing {filtered.length} of {photos.length}
          </p>
        </div>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((photo) => {
          const openLabel = `Open photograph ${photo.title || "Untitled"} (${photo.shortRef})`;
          return (
            <li key={photo.id}>
              <article className="flex h-full flex-col border border-line bg-ink-soft/30 transition-colors hover:border-paper/40">
                <button
                  type="button"
                  onClick={(e) => openPhoto(photo.id, e.currentTarget)}
                  aria-label={openLabel}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-ink text-left outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                  <ProtectedImage
                    src={photo.publicUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                  />
                </button>
                <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => openPhoto(photo.id, e.currentTarget)}
                      aria-label={openLabel}
                      className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                    >
                      <p className="font-brand text-[11px] tracking-[0.1em] text-ember uppercase">
                        {photo.shortRef}
                      </p>
                      <p className="mt-1 truncate font-display text-xl italic text-paper">
                        {photo.title || "Untitled"}
                      </p>
                    </button>
                    <CopyIdButton id={photo.id} />
                  </div>
                  <p className="break-all font-mono text-[10px] leading-relaxed text-fog">
                    {photo.id}
                  </p>
                  <p className="truncate font-mono text-[10px] text-paper/55">
                    {photo.storagePath}
                  </p>
                  <Badges photo={photo} />
                  <p className="font-brand text-xs text-fog tabular-nums">
                    Memberships: {photo.membershipCount}
                  </p>
                  <MembershipList photo={photo} sites={sites} dense />
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-12 font-brand text-paper-dim">
          No photographs match this filter.
        </p>
      ) : null}

      {selected ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/92 p-4 backdrop-blur-sm sm:p-8"
          onClick={closePhoto}
          onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Escape") closePhoto();
          }}
        >
          <div
            className="relative grid max-h-[min(92vh,56rem)] w-full max-w-6xl overflow-hidden border border-line bg-ink lg:grid-cols-[1.4fr_1fr]"
            onClick={(e) => e.stopPropagation()}
          >
            <PhotoLightboxImage photo={selected} priority />
            <div className="flex max-h-[min(92vh,56rem)] flex-col overflow-y-auto p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-brand text-xs tracking-[0.12em] text-ember uppercase">
                    {selected.shortRef}
                  </p>
                  <h2 className="mt-2 font-display text-3xl italic text-paper">
                    {selected.title || "Untitled"}
                  </h2>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closePhoto}
                  className="border border-line px-3 py-1.5 font-brand text-sm text-paper-dim hover:text-paper"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <p className="break-all font-mono text-xs text-fog">{selected.id}</p>
                <CopyIdButton id={selected.id} />
              </div>

              <p className="mt-3 break-all font-mono text-xs text-paper/60">
                {selected.storagePath}
              </p>

              <div className="mt-4">
                <Badges photo={selected} />
              </div>

              <p className="mt-4 font-brand text-sm text-fog tabular-nums">
                Memberships: {selected.membershipCount}
                {selected.createdAt
                  ? ` · created ${selected.createdAt.slice(0, 10)}`
                  : ""}
                {` · scale ${selected.displayScale}`}
              </p>

              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2 font-brand text-xs tracking-[0.1em] text-fog uppercase">
                  Memberships
                </p>
                <MembershipList photo={selected} sites={sites} />
              </div>

              {(selected.legacyCategories.length > 0 ||
                selected.legacySortOrder != null) && (
                <div className="mt-4 border-t border-line pt-4">
                  <p className="mb-2 font-brand text-xs tracking-[0.1em] text-fog uppercase">
                    Legacy diagnostic (not allocation truth)
                  </p>
                  <p className="font-brand text-sm text-paper/60">
                    categories:{" "}
                    {selected.legacyCategories.length
                      ? selected.legacyCategories.join(", ")
                      : "[]"}
                  </p>
                  <p className="font-brand text-sm text-paper/60">
                    sort_order: {selected.legacySortOrder ?? "—"}
                  </p>
                </div>
              )}

              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => goRelative(-1)}
                  disabled={filtered.length < 2}
                  className="border border-line px-3 py-2 font-brand text-sm text-paper-dim hover:text-paper disabled:opacity-30"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => goRelative(1)}
                  disabled={filtered.length < 2}
                  className="border border-line px-3 py-2 font-brand text-sm text-paper-dim hover:text-paper disabled:opacity-30"
                >
                  Next →
                </button>
                <p className="ml-auto self-center font-brand text-xs text-fog tabular-nums">
                  {selectedIndex + 1} / {filtered.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
