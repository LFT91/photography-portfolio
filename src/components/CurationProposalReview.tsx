"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProtectedImage } from "@/components/ProtectedImage";
import {
  VALID_CURATION_DESTINATIONS,
  type CurationPhoto,
} from "@/lib/curation";
import type { CollectionOption, SiteOption } from "@/lib/curation-data";
import {
  buildExportManifest,
  clearPersistedState,
  createWorkingDecisions,
  destinationLabel,
  filterWorkingDecisions,
  loadPersistedState,
  parseAndValidateManifest,
  parseProposalFilter,
  savePersistedState,
  storageKeyForManifest,
  summarizeProposals,
  validateProposalFields,
  type ImportedProposalManifest,
  type ProposalApproval,
  type ProposalFilter,
  type ProposalPublication,
  type WorkingDecision,
  type WorkingProposal,
} from "@/lib/curation-proposals";

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
        </li>
      ))}
    </ul>
  );
}

function approvalClass(approval: ProposalApproval): string {
  switch (approval) {
    case "approved":
      return "border-ember/70 text-ember";
    case "rejected":
      return "border-paper/40 text-paper/55";
    default:
      return "border-line text-fog";
  }
}

const PROPOSAL_FILTERS: {
  id: ProposalFilter;
  label: string;
  countKey: keyof ReturnType<typeof summarizeProposals>;
}[] = [
  { id: "all", label: "All", countKey: "all" },
  { id: "pending", label: "Pending", countKey: "pending" },
  { id: "approved", label: "Approved", countKey: "approved" },
  { id: "rejected", label: "Rejected", countKey: "rejected" },
  { id: "publish", label: "Publish", countKey: "publish" },
  { id: "hold", label: "Hold", countKey: "hold" },
  { id: "needs_title_change", label: "Needs title change", countKey: "needsTitleChange" },
  {
    id: "needs_membership_change",
    label: "Needs membership change",
    countKey: "needsMembershipChange",
  },
  { id: "related", label: "Related duplicate/variant", countKey: "related" },
  { id: "confidence_high", label: "Confidence high", countKey: "confidenceHigh" },
  { id: "confidence_medium", label: "Confidence medium", countKey: "confidenceMedium" },
  { id: "confidence_low", label: "Confidence low", countKey: "confidenceLow" },
];

type Props = {
  photos: CurationPhoto[];
  sites: SiteOption[];
  collections: CollectionOption[];
  readOnlyPreview?: boolean;
  onSwitchToAudit: () => void;
};

type SessionState = {
  manifest: ImportedProposalManifest;
  storageKey: string;
  decisions: WorkingDecision[];
};

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
          aria-hidden={!loaded}
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

export function CurationProposalReview({
  photos,
  sites,
  readOnlyPreview = false,
  onSwitchToAudit,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openTriggerRef = useRef<HTMLElement | null>(null);
  const confirmTitleId = useId();

  const filter = parseProposalFilter(searchParams.get("filter"));
  const siteId = searchParams.get("site");
  const collectionSlug = searchParams.get("collection");
  const selectedId = searchParams.get("photo");

  const [session, setSession] = useState<SessionState | null>(null);
  const [importErrors, setImportErrors] = useState<string[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [compareRelatedId, setCompareRelatedId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    | null
    | { type: "reset_all" }
    | { type: "batch_approve"; count: number; ids: string[] }
  >(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const photosById = useMemo(() => {
    const map = new Map<string, CurationPhoto>();
    for (const p of photos) map.set(p.id, p);
    return map;
  }, [photos]);

  const livePhotoIds = useMemo(() => new Set(photos.map((p) => p.id)), [photos]);

  const replaceQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("mode", "proposals");
      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const persist = useCallback((next: SessionState) => {
    setSession(next);
    savePersistedState({
      version: 1,
      storageKey: next.storageKey,
      decisions: next.decisions,
    });
  }, []);

  const updateDecision = useCallback(
    (photoId: string, updater: (d: WorkingDecision) => WorkingDecision) => {
      setSession((prev) => {
        if (!prev) return prev;
        const decisions = prev.decisions.map((d) =>
          d.photo_id === photoId ? updater(d) : d,
        );
        const next = { ...prev, decisions };
        savePersistedState({
          version: 1,
          storageKey: next.storageKey,
          decisions: next.decisions,
        });
        return next;
      });
    },
    [],
  );

  const applyProposalPatch = useCallback(
    (
      photoId: string,
      patch: Partial<WorkingProposal> & { reviewer_note?: string },
    ) => {
      updateDecision(photoId, (d) => {
        const { reviewer_note: notePatch, ...proposalPatch } = patch;
        let proposal: WorkingProposal = {
          ...d.proposal,
          ...proposalPatch,
          sort_order: null,
        };

        if (patch.publication === "hold") {
          proposal = {
            ...proposal,
            publication: "hold",
            site_id: null,
            collection_slug: null,
          };
        }

        if (
          patch.site_id !== undefined &&
          proposal.publication === "publish" &&
          patch.collection_slug === undefined
        ) {
          const stillValid = VALID_CURATION_DESTINATIONS.some(
            (dest) =>
              dest.siteId === proposal.site_id &&
              dest.slug === proposal.collection_slug,
          );
          if (!stillValid) proposal.collection_slug = null;
        }

        const err = validateProposalFields(proposal);
        setFieldError(err);

        return {
          ...d,
          proposal,
          reviewer_note:
            notePatch !== undefined ? notePatch : d.reviewer_note,
        };
      });
    },
    [updateDecision],
  );

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setImporting(true);
    setImportErrors(null);
    try {
      const text = await file.text();
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        setImportErrors(["Could not parse JSON."]);
        setSession(null);
        return;
      }

      const result = parseAndValidateManifest(raw, livePhotoIds);
      if (!result.ok) {
        setImportErrors(result.errors);
        setSession(null);
        return;
      }

      const key = storageKeyForManifest(result.manifest);
      const persisted = loadPersistedState(key);
      const decisions =
        persisted &&
        persisted.decisions.length === result.decisions.length &&
        new Set(persisted.decisions.map((d) => d.photo_id)).size ===
          result.decisions.length
          ? mergePersisted(result.decisions, persisted.decisions)
          : createWorkingDecisions(result.decisions);

      const next: SessionState = {
        manifest: result.manifest,
        storageKey: key,
        decisions,
      };
      persist(next);
      replaceQuery({ photo: null });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearManifest = () => {
    if (session) clearPersistedState(session.storageKey);
    setSession(null);
    setImportErrors(null);
    setCompareRelatedId(null);
    replaceQuery({ photo: null, filter: null, site: null, collection: null });
  };

  const summary = useMemo(
    () =>
      session
        ? summarizeProposals(session.decisions, photosById)
        : null,
    [session, photosById],
  );

  const filtered = useMemo(() => {
    if (!session) return [];
    return filterWorkingDecisions(session.decisions, photosById, {
      filter,
      siteId,
      collectionSlug,
    });
  }, [session, photosById, filter, siteId, collectionSlug]);

  const selectedIndex = useMemo(() => {
    if (!selectedId) return -1;
    return filtered.findIndex((d) => d.photo_id === selectedId);
  }, [filtered, selectedId]);

  const selected = selectedIndex >= 0 ? filtered[selectedIndex] : null;
  const selectedPhoto = selected ? photosById.get(selected.photo_id) ?? null : null;

  const collectionsForSite = useMemo(() => {
    if (!siteId) return VALID_CURATION_DESTINATIONS;
    return VALID_CURATION_DESTINATIONS.filter((d) => d.siteId === siteId);
  }, [siteId]);

  useEffect(() => {
    if (!selectedId) return;
    if (filtered.some((d) => d.photo_id === selectedId)) return;
    replaceQuery({ photo: null });
  }, [filtered, selectedId, replaceQuery]);

  useEffect(() => {
    if (!selectedId || !selected) return;
    queueMicrotask(() => closeButtonRef.current?.focus());
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps -- focus only when opened photo changes


  const goRelative = useCallback(
    (delta: number) => {
      if (selectedIndex < 0 || filtered.length === 0) return;
      const next =
        (selectedIndex + delta + filtered.length) % filtered.length;
      replaceQuery({ photo: filtered[next].photo_id });
      setCompareRelatedId(null);
      setFieldError(null);
    },
    [filtered, selectedIndex, replaceQuery],
  );

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (compareRelatedId || confirmAction) return;
      if (e.key === "Escape") {
        openTriggerRef.current?.focus();
        replaceQuery({ photo: null });
      }
      if (e.key === "ArrowLeft") goRelative(-1);
      if (e.key === "ArrowRight") goRelative(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    selected,
    compareRelatedId,
    confirmAction,
    goRelative,
    replaceQuery,
  ]);

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

  const approveOne = (photoId: string) => {
    const d = session?.decisions.find((x) => x.photo_id === photoId);
    if (!d) return;
    const err = validateProposalFields(d.proposal);
    if (err) {
      setFieldError(err);
      return;
    }
    applyProposalPatch(photoId, { approval: "approved" });
    setFieldError(null);
  };

  const resetOne = (photoId: string) => {
    updateDecision(photoId, (d) => ({
      photo_id: d.photo_id,
      original: d.original,
      proposal: { ...d.original.proposal, sort_order: null },
      reviewer_note: "",
    }));
    setFieldError(null);
  };

  const exportWorking = () => {
    if (!session) return;
    const payload = buildExportManifest(session.manifest, session.decisions);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curation-proposals-working-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const batchApproveFiltered = () => {
    if (!session) return;
    const ids = filtered
      .filter((d) => d.proposal.approval !== "rejected")
      .filter((d) => validateProposalFields(d.proposal) == null)
      .map((d) => d.photo_id);
    if (!ids.length) return;
    setConfirmAction({ type: "batch_approve", count: ids.length, ids });
  };

  const runConfirm = () => {
    if (!confirmAction || !session) return;
    if (confirmAction.type === "reset_all") {
      const decisions = createWorkingDecisions(
        session.decisions.map((d) => d.original),
      );
      persist({ ...session, decisions });
      setFieldError(null);
    } else if (confirmAction.type === "batch_approve") {
      const idSet = new Set(confirmAction.ids);
      const decisions = session.decisions.map((d) => {
        if (!idSet.has(d.photo_id)) return d;
        if (d.proposal.approval === "rejected") return d;
        return {
          ...d,
          proposal: { ...d.proposal, approval: "approved" as const },
        };
      });
      persist({ ...session, decisions });
    }
    setConfirmAction(null);
  };

  const relatedDecision =
    selected?.original.related_photo_id && session
      ? session.decisions.find(
          (d) => d.photo_id === selected.original.related_photo_id,
        ) ?? null
      : null;
  const relatedPhoto = relatedDecision
    ? photosById.get(relatedDecision.photo_id) ?? null
    : null;

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-12 sm:px-8 sm:py-16">
      {readOnlyPreview ? (
        <p
          role="status"
          className="mb-6 border border-ember/50 bg-ember/10 px-4 py-3 font-brand text-sm tracking-[0.04em] text-ember"
        >
          Read-only preview — proposal edits stay in this browser only. Nothing
          is written to Supabase.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-brand text-xs tracking-[0.14em] text-ember uppercase">
            Admin · proposal review · local only
          </p>
          <h1 className="mt-2 font-display text-4xl italic text-paper sm:text-5xl">
            Proposal review
          </h1>
          <p className="mt-3 max-w-2xl font-brand text-sm leading-relaxed text-paper/80 sm:text-base">
            Import the AI curation manifest, review locally, and export working
            decisions. Approval does not apply anything to the database.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSwitchToAudit}
            className="border border-line px-4 py-2 font-brand text-sm text-paper-dim transition-colors hover:text-paper"
          >
            Phase 1 audit
          </button>
          {session ? (
            <>
              <button
                type="button"
                onClick={exportWorking}
                className="border border-ember px-4 py-2 font-brand text-sm tracking-[0.06em] text-ember transition-colors hover:bg-ember/10"
              >
                Export working manifest
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction({ type: "reset_all" })}
                className="border border-line px-4 py-2 font-brand text-sm text-paper-dim hover:text-paper"
              >
                Reset all reviews
              </button>
              <button
                type="button"
                onClick={clearManifest}
                className="border border-line px-4 py-2 font-brand text-sm text-paper-dim hover:text-paper"
              >
                Clear manifest
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-8 border border-line bg-ink-soft/20 p-4 sm:p-5">
        <label className="block">
          <span className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
            Import proposal manifest (browser only)
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            aria-label="Import curation proposal manifest JSON"
            disabled={importing}
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full font-brand text-sm text-paper file:mr-3 file:border file:border-line file:bg-ink file:px-3 file:py-2 file:font-brand file:text-sm file:text-paper"
          />
        </label>
        {importing ? (
          <p className="mt-2 font-brand text-sm text-fog">Validating…</p>
        ) : null}
        {session ? (
          <p className="mt-2 font-brand text-sm text-paper/70">
            Loaded{" "}
            <span className="text-paper">
              {session.manifest.manifest_name ?? "manifest"}
            </span>
            {" · "}
            {session.decisions.length} decisions · edits stored in this browser
          </p>
        ) : null}
      </div>

      {importErrors?.length ? (
        <div
          role="alert"
          className="mt-6 border border-ember/60 bg-ember/10 px-4 py-3"
        >
          <p className="font-brand text-sm text-ember">
            Manifest validation failed — no changes applied.
          </p>
          <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-y-auto pl-5 font-brand text-xs text-paper/80">
            {importErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {!session ? (
        <p className="mt-10 font-brand text-paper-dim">
          Import a valid proposal manifest to begin review.
        </p>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap gap-2">
            {PROPOSAL_FILTERS.map((f) => {
              const active = filter === f.id;
              const count = summary?.[f.countKey] ?? 0;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() =>
                    replaceQuery({
                      filter: f.id === "all" ? null : f.id,
                      photo: null,
                    })
                  }
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

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
                Proposed site
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
                Proposed collection
              </span>
              <select
                value={collectionSlug ?? ""}
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
                  <option key={`${c.siteId}/${c.slug}`} value={c.slug}>
                    {siteLabel(c.siteId, sites)} · {c.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <p className="font-brand text-sm text-fog tabular-nums">
                Showing {filtered.length} of {session.decisions.length}
              </p>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={batchApproveFiltered}
                disabled={
                  filtered.filter(
                    (d) =>
                      d.proposal.approval !== "rejected" &&
                      validateProposalFields(d.proposal) == null,
                  ).length === 0
                }
                className="w-full border border-line px-3 py-2.5 font-brand text-sm text-paper-dim hover:text-paper disabled:opacity-40"
              >
                Batch approve filtered…
              </button>
            </div>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((decision) => {
              const photo = photosById.get(decision.photo_id);
              if (!photo) return null;
              const openLabel = `Open proposal for ${photo.title || "Untitled"} (${photo.shortRef})`;
              return (
                <li key={decision.photo_id}>
                  <article className="flex h-full flex-col border border-line bg-ink-soft/30 transition-colors hover:border-paper/40">
                    <button
                      type="button"
                      onClick={(e) => openPhoto(decision.photo_id, e.currentTarget)}
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
                          onClick={(e) =>
                            openPhoto(decision.photo_id, e.currentTarget)
                          }
                          aria-label={openLabel}
                          className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ember"
                        >
                          <p className="font-brand text-[11px] tracking-[0.1em] text-ember uppercase">
                            {photo.shortRef}
                          </p>
                          <p className="mt-1 truncate font-display text-lg italic text-paper/70">
                            {photo.title || "Untitled"}
                          </p>
                          <p className="mt-0.5 truncate font-display text-xl italic text-paper">
                            → {decision.proposal.title}
                          </p>
                        </button>
                        <CopyIdButton id={photo.id} />
                      </div>
                      <p className="font-brand text-xs text-fog">
                        Current:{" "}
                        {photo.membershipCount
                          ? photo.memberships
                              .map((m) => `${m.title}`)
                              .join(", ")
                          : "Unassigned"}
                      </p>
                      <p className="font-brand text-sm text-paper/85">
                        Proposed:{" "}
                        {destinationLabel(
                          decision.proposal.site_id,
                          decision.proposal.collection_slug,
                        )}
                      </p>
                      <p className="line-clamp-2 font-brand text-xs text-paper/60">
                        {decision.original.reason}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`border px-1.5 py-0.5 font-brand text-[10px] tracking-[0.08em] uppercase ${approvalClass(decision.proposal.approval)}`}
                        >
                          {decision.proposal.approval}
                        </span>
                        <span className="border border-line px-1.5 py-0.5 font-brand text-[10px] tracking-[0.08em] text-fog uppercase">
                          {decision.proposal.publication}
                        </span>
                        <span className="border border-line px-1.5 py-0.5 font-brand text-[10px] tracking-[0.08em] text-fog uppercase">
                          {decision.original.confidence}
                        </span>
                        {decision.original.related_photo_id ? (
                          <span className="border border-line px-1.5 py-0.5 font-brand text-[10px] tracking-[0.08em] text-fog uppercase">
                            Related
                          </span>
                        ) : null}
                      </div>
                      {decision.original.required_changes.length ? (
                        <p className="font-brand text-[11px] text-fog">
                          Changes: {decision.original.required_changes.join(", ")}
                        </p>
                      ) : null}
                      <div className="mt-auto flex flex-wrap gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => approveOne(decision.photo_id)}
                          disabled={decision.proposal.approval === "approved"}
                          className="border border-ember/70 px-2.5 py-1 font-brand text-xs text-ember hover:bg-ember/10 disabled:opacity-40"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={(e) =>
                            openPhoto(decision.photo_id, e.currentTarget)
                          }
                          className="border border-line px-2.5 py-1 font-brand text-xs text-paper-dim hover:text-paper"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>

          {filtered.length === 0 ? (
            <p className="mt-12 font-brand text-paper-dim">
              No proposals match this filter.
            </p>
          ) : null}
        </>
      )}

      {selected && selectedPhoto ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Review proposal for ${selectedPhoto.title || "photograph"}`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/92 p-4 backdrop-blur-sm sm:p-8"
          onClick={closePhoto}
          onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Escape") closePhoto();
          }}
        >
          <div
            className="relative grid max-h-[min(94vh,58rem)] w-full max-w-6xl overflow-hidden border border-line bg-ink lg:grid-cols-[1.25fr_1fr]"
            onClick={(e) => e.stopPropagation()}
          >
            <PhotoLightboxImage photo={selectedPhoto} priority />
            <div className="flex max-h-[min(94vh,58rem)] flex-col overflow-y-auto p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-brand text-xs tracking-[0.12em] text-ember uppercase">
                    {selectedPhoto.shortRef}
                  </p>
                  <h2 className="mt-2 font-display text-2xl italic text-paper sm:text-3xl">
                    {selectedPhoto.title || "Untitled"}
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

              <div className="mt-3 flex items-center gap-2">
                <p className="break-all font-mono text-xs text-fog">
                  {selectedPhoto.id}
                </p>
                <CopyIdButton id={selectedPhoto.id} />
              </div>

              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2 font-brand text-xs tracking-[0.1em] text-fog uppercase">
                  Current memberships
                </p>
                <MembershipList photo={selectedPhoto} sites={sites} />
              </div>

              <div className="mt-4 space-y-3 border-t border-line pt-4">
                <label className="block">
                  <span className="font-brand text-xs tracking-[0.1em] text-fog uppercase">
                    Proposed display title
                  </span>
                  <input
                    type="text"
                    value={selected.proposal.title}
                    onChange={(e) =>
                      applyProposalPatch(selected.photo_id, {
                        title: e.target.value,
                      })
                    }
                    className="mt-1.5 w-full border border-line bg-ink px-3 py-2 font-brand text-sm text-paper outline-none focus:border-ember"
                  />
                </label>

                <fieldset>
                  <legend className="font-brand text-xs tracking-[0.1em] text-fog uppercase">
                    Publication
                  </legend>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {(["publish", "hold"] as ProposalPublication[]).map(
                      (pub) => (
                        <button
                          key={pub}
                          type="button"
                          aria-pressed={selected.proposal.publication === pub}
                          onClick={() =>
                            applyProposalPatch(selected.photo_id, {
                              publication: pub,
                              ...(pub === "hold"
                                ? { site_id: null, collection_slug: null }
                                : {}),
                            })
                          }
                          className={`border px-3 py-1.5 font-brand text-sm capitalize ${
                            selected.proposal.publication === pub
                              ? "border-ember text-ember"
                              : "border-line text-paper-dim"
                          }`}
                        >
                          {pub}
                        </button>
                      ),
                    )}
                  </div>
                </fieldset>

                {selected.proposal.publication === "publish" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="font-brand text-xs tracking-[0.1em] text-fog uppercase">
                        Site
                      </span>
                      <select
                        value={selected.proposal.site_id ?? ""}
                        onChange={(e) =>
                          applyProposalPatch(selected.photo_id, {
                            site_id: e.target.value || null,
                            collection_slug: null,
                          })
                        }
                        className="mt-1.5 w-full border border-line bg-ink px-3 py-2 font-brand text-sm text-paper outline-none focus:border-ember"
                      >
                        <option value="">Select site</option>
                        {sites.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="font-brand text-xs tracking-[0.1em] text-fog uppercase">
                        Collection
                      </span>
                      <select
                        value={selected.proposal.collection_slug ?? ""}
                        onChange={(e) =>
                          applyProposalPatch(selected.photo_id, {
                            collection_slug: e.target.value || null,
                          })
                        }
                        disabled={!selected.proposal.site_id}
                        className="mt-1.5 w-full border border-line bg-ink px-3 py-2 font-brand text-sm text-paper outline-none focus:border-ember disabled:opacity-40"
                      >
                        <option value="">Select collection</option>
                        {VALID_CURATION_DESTINATIONS.filter(
                          (d) => d.siteId === selected.proposal.site_id,
                        ).map((d) => (
                          <option key={d.slug} value={d.slug}>
                            {d.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : (
                  <p className="font-brand text-sm text-fog">
                    Hold — no public destination.
                  </p>
                )}

                <fieldset>
                  <legend className="font-brand text-xs tracking-[0.1em] text-fog uppercase">
                    Approval (for future application)
                  </legend>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {(["pending", "approved", "rejected"] as ProposalApproval[]).map(
                      (a) => (
                        <button
                          key={a}
                          type="button"
                          aria-pressed={selected.proposal.approval === a}
                          onClick={() => {
                            if (a === "approved") {
                              const err = validateProposalFields(
                                selected.proposal,
                              );
                              if (err) {
                                setFieldError(err);
                                return;
                              }
                            }
                            applyProposalPatch(selected.photo_id, {
                              approval: a,
                            });
                            setFieldError(null);
                          }}
                          className={`border px-3 py-1.5 font-brand text-sm capitalize ${
                            selected.proposal.approval === a
                              ? approvalClass(a)
                              : "border-line text-paper-dim"
                          }`}
                        >
                          {a}
                        </button>
                      ),
                    )}
                  </div>
                </fieldset>

                <label className="block">
                  <span className="font-brand text-xs tracking-[0.1em] text-fog uppercase">
                    Reviewer note (optional)
                  </span>
                  <textarea
                    value={selected.reviewer_note}
                    onChange={(e) =>
                      applyProposalPatch(selected.photo_id, {
                        reviewer_note: e.target.value,
                      })
                    }
                    rows={2}
                    className="mt-1.5 w-full border border-line bg-ink px-3 py-2 font-brand text-sm text-paper outline-none focus:border-ember"
                  />
                </label>

                {fieldError ? (
                  <p role="alert" className="font-brand text-sm text-ember">
                    {fieldError}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 border-t border-line pt-4">
                <p className="font-brand text-xs tracking-[0.1em] text-fog uppercase">
                  Reason · confidence
                </p>
                <p className="mt-1 font-brand text-sm text-paper/80">
                  {selected.original.reason}
                </p>
                <p className="mt-1 font-brand text-xs text-fog capitalize">
                  Confidence: {selected.original.confidence}
                </p>
                {selected.original.required_changes.length ? (
                  <p className="mt-2 font-brand text-xs text-fog">
                    Required: {selected.original.required_changes.join(", ")}
                  </p>
                ) : null}
              </div>

              {selected.original.related_photo_id ? (
                <div className="mt-4 border-t border-line pt-4">
                  <p className="font-brand text-xs tracking-[0.1em] text-fog uppercase">
                    Related photograph
                  </p>
                  <p className="mt-1 font-brand text-sm text-paper/70">
                    {selected.original.relationship?.replace(/_/g, " ") ??
                      "Related"}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setCompareRelatedId(selected.original.related_photo_id)
                    }
                    className="mt-2 border border-line px-3 py-1.5 font-brand text-sm text-paper-dim hover:text-paper"
                  >
                    Compare related photographs
                  </button>
                </div>
              ) : null}

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
                <button
                  type="button"
                  onClick={() => approveOne(selected.photo_id)}
                  className="border border-ember px-3 py-2 font-brand text-sm text-ember hover:bg-ember/10"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => resetOne(selected.photo_id)}
                  className="border border-line px-3 py-2 font-brand text-sm text-paper-dim hover:text-paper"
                >
                  Reset to import
                </button>
                <p className="ml-auto self-center font-brand text-xs text-fog tabular-nums">
                  {selectedIndex + 1} / {filtered.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {compareRelatedId && selected && selectedPhoto && relatedPhoto && relatedDecision ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Compare related photographs"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-sm sm:p-8"
          onClick={() => setCompareRelatedId(null)}
          onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Escape") setCompareRelatedId(null);
          }}
        >
          <div
            className="max-h-[min(94vh,58rem)] w-full max-w-6xl overflow-y-auto border border-line bg-ink p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl italic text-paper">
                  Related comparison
                </h2>
                <p className="mt-1 font-brand text-sm text-fog capitalize">
                  {selected.original.relationship?.replace(/_/g, " ")}
                </p>
              </div>
              <button
                type="button"
                autoFocus
                onClick={() => setCompareRelatedId(null)}
                className="border border-line px-3 py-1.5 font-brand text-sm text-paper-dim hover:text-paper"
              >
                Back to original
              </button>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {[
                {
                  label: "Original",
                  photo: selectedPhoto,
                  decision: selected,
                },
                {
                  label: "Related",
                  photo: relatedPhoto,
                  decision: relatedDecision,
                },
              ].map(({ label, photo, decision }) => (
                <div key={photo.id} className="border border-line p-3">
                  <p className="font-brand text-xs tracking-[0.1em] text-ember uppercase">
                    {label}
                  </p>
                  <div className="relative mt-2 aspect-[4/3] bg-ink-soft">
                    <ProtectedImage
                      key={photo.id}
                      src={photo.publicUrl}
                      alt={photo.title || label}
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-contain"
                    />
                  </div>
                  <p className="mt-3 break-all font-mono text-[10px] text-fog">
                    {photo.id}
                  </p>
                  <p className="mt-1 font-display text-xl italic text-paper">
                    {photo.title || "Untitled"}
                  </p>
                  <p className="mt-1 font-brand text-sm text-paper/70">
                    Proposed: {decision.proposal.title}
                  </p>
                  <div className="mt-2">
                    <MembershipList photo={photo} sites={sites} dense />
                  </div>
                  <p className="mt-2 font-brand text-sm text-paper/80">
                    →{" "}
                    {destinationLabel(
                      decision.proposal.site_id,
                      decision.proposal.collection_slug,
                    )}{" "}
                    · {decision.proposal.approval}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 font-brand text-xs text-fog">
              Related comparison does not auto-approve either photograph.
            </p>
          </div>
        </div>
      ) : null}

      {confirmAction ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={confirmTitleId}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-4"
          onClick={() => setConfirmAction(null)}
          onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Escape") setConfirmAction(null);
          }}
        >
          <div
            className="w-full max-w-md border border-line bg-ink p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={confirmTitleId}
              className="font-display text-2xl italic text-paper"
            >
              {confirmAction.type === "reset_all"
                ? "Reset entire working review?"
                : `Approve ${confirmAction.count} proposals?`}
            </h2>
            <p className="mt-3 font-brand text-sm text-paper/75">
              {confirmAction.type === "reset_all"
                ? "This restores every decision to the imported proposal and clears reviewer notes. Local only."
                : `Marks ${confirmAction.count} currently filtered proposals as approved in local working state only. Rejected items are excluded. Titles and destinations are not changed.`}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                autoFocus
                onClick={runConfirm}
                className="border border-ember px-4 py-2 font-brand text-sm text-ember hover:bg-ember/10"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="border border-line px-4 py-2 font-brand text-sm text-paper-dim hover:text-paper"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function mergePersisted(
  imported: import("@/lib/curation-proposals").ImportedDecision[],
  persisted: WorkingDecision[],
): WorkingDecision[] {
  const byId = new Map(persisted.map((d) => [d.photo_id, d]));
  return imported.map((original) => {
    const existing = byId.get(original.photo_id);
    if (!existing) {
      return {
        photo_id: original.photo_id,
        original,
        proposal: { ...original.proposal, sort_order: null },
        reviewer_note: "",
      };
    }
    return {
      photo_id: original.photo_id,
      original,
      proposal: { ...existing.proposal, sort_order: null },
      reviewer_note: existing.reviewer_note ?? "",
    };
  });
}
