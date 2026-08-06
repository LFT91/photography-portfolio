"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";

/** Sign-in only — after login you edit on the live site. */
export function AdminPanel() {
  const configured = hasSupabaseEnv();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(configured);

  const supabase = useMemo(
    () => (configured ? createClient() : null),
    [configured],
  );

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      if (data.user) {
        router.replace("/work");
        return;
      }
      setChecking(false);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase, router]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signError) {
      setError(signError.message);
      setBusy(false);
      return;
    }
    router.replace("/work");
  };

  if (!configured) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        <h1 className="font-display text-4xl italic text-paper">Admin</h1>
        <p className="mt-4 font-brand text-paper-dim">
          Supabase is not configured. Add{" "}
          <code className="text-ember">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-ember">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to
          your environment.
        </p>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center font-brand text-paper-dim">
        Checking session…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="font-display text-4xl italic text-paper">Admin sign in</h1>
      <p className="mt-3 font-brand text-sm text-paper-dim">
        After you sign in, you&apos;ll land on the live site with edit controls
        on the photos.
      </p>
      <form onSubmit={signIn} className="mt-10 space-y-5">
        <label className="block">
          <span className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2 w-full border border-line bg-transparent px-4 py-3 font-brand text-paper outline-none focus:border-ember"
          />
        </label>
        <label className="block">
          <span className="font-brand text-xs tracking-[0.12em] text-fog uppercase">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-2 w-full border border-line bg-transparent px-4 py-3 font-brand text-paper outline-none focus:border-ember"
          />
        </label>
        {error ? <p className="font-brand text-sm text-ember">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full border border-ember px-4 py-3 font-brand text-sm tracking-[0.08em] text-ember transition-colors hover:bg-ember/10 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in & edit site"}
        </button>
      </form>
    </div>
  );
}
