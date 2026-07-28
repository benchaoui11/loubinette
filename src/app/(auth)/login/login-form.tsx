"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase Auth is not configured yet. Add environment variables first.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Incorrect email/password, or this account is not available in Supabase Auth.");
      setLoading(false);
      return;
    }
    router.replace("/command-center");
    router.refresh();
  }

  return (
    <form onSubmit={signIn} className="panel w-full max-w-md rounded-2xl p-6">
      <div className="mb-7 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl border border-blue-300/30 bg-blue-400/12 text-blue-100">
          <LockKeyhole className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Secure admin sign in</h1>
          <p className="text-sm text-slate-400">Owner bootstrap uses `OWNER_ADMIN_EMAIL`.</p>
        </div>
      </div>
      <label className="mb-4 block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Email</span>
        <input className="w-full rounded-lg border border-slate-600/50 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none focus:border-blue-300/60" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
      </label>
      <label className="mb-5 block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Password</span>
        <input className="w-full rounded-lg border border-slate-600/50 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none focus:border-blue-300/60" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </label>
      {error ? <p className="mb-4 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">{error}</p> : null}
      <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading}>
        {loading ? "Signing in" : "Enter Control Center"}
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
