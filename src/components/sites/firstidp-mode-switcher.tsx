"use client";

import { Loader2, RefreshCw, ToggleLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FirstIdpMode } from "@/lib/sites/firstidp-mode-switching";
import { FIRSTIDP_SITE_UUID } from "@/lib/sites/site-config";

type ModePayload = {
  mode?: FirstIdpMode;
  updatedAt?: string | null;
  updatedBy?: string | null;
  changed?: boolean;
  error?: string;
};

type RequestState = {
  mode: FirstIdpMode | null;
  updatedAt: string | null;
  updatedBy: string | null;
  loading: boolean;
  changing: FirstIdpMode | null;
  message: string | null;
  error: string | null;
};

const INITIAL_STATE: RequestState = {
  mode: null,
  updatedAt: null,
  updatedBy: null,
  loading: true,
  changing: null,
  message: null,
  error: null,
};

function modeLabel(mode: FirstIdpMode | null) {
  if (mode === "white") return "White Page";
  if (mode === "offer") return "Offer Page";
  return "Unknown";
}

function formatUpdatedAt(value: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function FirstIdpModeSwitcher() {
  const [state, setState] = useState<RequestState>(INITIAL_STATE);

  const loadMode = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await fetch(`/api/sites/${FIRSTIDP_SITE_UUID}/mode`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as ModePayload;

      if (!response.ok || !payload.mode) {
        throw new Error(payload.error || "Could not load the current FirstIDP page mode.");
      }

      setState((current) => ({
        ...current,
        mode: payload.mode ?? null,
        updatedAt: payload.updatedAt ?? null,
        updatedBy: payload.updatedBy ?? null,
        loading: false,
        message: null,
        error: null,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Could not load the current FirstIDP page mode.",
      }));
    }
  }, []);

  useEffect(() => {
    void loadMode();
  }, [loadMode]);

  async function activateMode(mode: FirstIdpMode) {
    if (state.mode === mode) return;

    const confirmed = window.confirm(`Activate ${modeLabel(mode)} for FirstIDP?`);
    if (!confirmed) return;

    setState((current) => ({ ...current, changing: mode, message: null, error: null }));

    try {
      const response = await fetch(`/api/sites/${FIRSTIDP_SITE_UUID}/mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
        cache: "no-store",
      });
      const payload = (await response.json()) as ModePayload;

      if (!response.ok || !payload.mode) {
        throw new Error(payload.error || "Could not switch FirstIDP page mode.");
      }

      setState((current) => ({
        ...current,
        mode: payload.mode ?? null,
        updatedAt: payload.updatedAt ?? null,
        updatedBy: payload.updatedBy ?? null,
        changing: null,
        message: `FirstIDP is now using ${modeLabel(payload.mode ?? null)}.`,
        error: null,
      }));
      void loadMode();
    } catch (error) {
      setState((current) => ({
        ...current,
        changing: null,
        error: error instanceof Error ? error.message : "Could not switch FirstIDP page mode.",
      }));
    }
  }

  return (
    <section className="panel rounded-2xl p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">FirstIDP Switching</p>
          <h2 className="text-xl font-semibold text-white">Live page mode</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Switching is limited to the owner admin and only applies to FirstIDP.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-slate-600/40 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:text-slate-500"
          type="button"
          onClick={() => void loadMode()}
          disabled={state.loading || Boolean(state.changing)}
        >
          {state.loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refresh
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-500/20 bg-slate-950/30 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Current mode</div>
          <div className="mt-2 text-2xl font-semibold text-white">{state.loading ? "Loading..." : modeLabel(state.mode)}</div>
          <div className="mt-2 text-xs text-slate-500">Updated {formatUpdatedAt(state.updatedAt)}</div>
        </div>
        <ModeButton target="white" current={state.mode} changing={state.changing} loading={state.loading} onActivate={activateMode} />
        <ModeButton target="offer" current={state.mode} changing={state.changing} loading={state.loading} onActivate={activateMode} />
      </div>

      {state.message ? (
        <p className="mt-4 rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">
          {state.message}
        </p>
      ) : null}
      {state.error ? (
        <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
          {state.error}
        </p>
      ) : null}
    </section>
  );
}

function ModeButton({
  target,
  current,
  changing,
  loading,
  onActivate,
}: {
  target: FirstIdpMode;
  current: FirstIdpMode | null;
  changing: FirstIdpMode | null;
  loading: boolean;
  onActivate: (mode: FirstIdpMode) => void;
}) {
  const isCurrent = current === target;
  const isChanging = changing === target;

  return (
    <button
      className="flex min-h-28 flex-col items-start justify-between rounded-lg border border-blue-200/25 bg-blue-300/10 p-4 text-left text-blue-100 hover:bg-blue-300/15 disabled:cursor-not-allowed disabled:border-slate-500/20 disabled:bg-slate-400/10 disabled:text-slate-400"
      type="button"
      disabled={loading || isCurrent || Boolean(changing)}
      onClick={() => onActivate(target)}
    >
      <span className="inline-flex items-center gap-2 text-sm font-medium">
        {isChanging ? <Loader2 className="size-4 animate-spin" /> : <ToggleLeft className="size-4" />}
        Activate {modeLabel(target)}
      </span>
      <span className="text-xs text-slate-400">
        {isCurrent ? "Currently active" : isChanging ? "Switching..." : "Requires confirmation"}
      </span>
    </button>
  );
}
