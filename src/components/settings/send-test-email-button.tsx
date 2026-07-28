"use client";

import { Loader2, MailCheck } from "lucide-react";
import { useState } from "react";

type TestEmailResponse = {
  ok?: boolean;
  error?: string;
  details?: string;
};

export function SendTestEmailButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendTestEmail() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/settings/send-test-email", {
        method: "POST",
        cache: "no-store",
      });
      const payload = (await response.json()) as TestEmailResponse;

      if (!response.ok || !payload.ok) {
        throw new Error([payload.error, payload.details].filter(Boolean).join(" ") || "The test email could not be sent.");
      }

      setMessage("Test email sent to the owner admin email.");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "The test email could not be sent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">Email Diagnostic</p>
          <h2 className="text-xl font-semibold text-white">Send test email</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Sends one diagnostic email to the configured owner admin address using Resend.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200/25 bg-blue-300/10 px-4 py-2 text-sm font-medium text-blue-100 hover:bg-blue-300/15 disabled:cursor-not-allowed disabled:border-slate-500/20 disabled:bg-slate-400/10 disabled:text-slate-400"
          type="button"
          onClick={() => void sendTestEmail()}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <MailCheck className="size-4" />}
          {loading ? "Sending..." : "Send Test Email"}
        </button>
      </div>

      {message ? (
        <p className="mt-4 rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
    </section>
  );
}
