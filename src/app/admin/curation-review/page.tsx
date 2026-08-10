import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CurationReview } from "@/components/CurationReview";
import {
  loadCurationFilterOptions,
  loadCurationPhotos,
} from "@/lib/curation-data";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Curation review | Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function requireAdminSession() {
  if (!hasSupabaseEnv()) {
    return { ok: false as const, reason: "Supabase is not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin");
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc(
    "is_app_admin",
  );

  if (adminError) {
    return {
      ok: false as const,
      reason: `Could not verify admin: ${adminError.message}`,
      supabase,
    };
  }

  if (!isAdmin) {
    redirect("/admin");
  }

  return { ok: true as const, supabase };
}

export default async function CurationReviewPage() {
  const auth = await requireAdminSession();

  if (!auth.ok) {
    return (
      <main className="min-h-svh bg-ink px-5 py-16 sm:px-8">
        <h1 className="font-display text-4xl italic text-paper">
          Curation review
        </h1>
        <p className="mt-4 font-brand text-paper-dim">{auth.reason}</p>
      </main>
    );
  }

  const [{ photos, error: photosError }, options] = await Promise.all([
    loadCurationPhotos(auth.supabase),
    loadCurationFilterOptions(auth.supabase),
  ]);

  const loadError = photosError || options.error;

  return (
    <main className="min-h-svh bg-ink pb-28">
      <Suspense
        fallback={
          <div className="px-5 py-24 text-center font-brand text-paper-dim">
            Loading curation review…
          </div>
        }
      >
        <CurationReview
          photos={photos}
          sites={options.sites}
          collections={options.collections}
          loadError={loadError}
        />
      </Suspense>
    </main>
  );
}
