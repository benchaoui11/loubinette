"use client";

import { Loader2, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { GlobalSearchResult } from "@/lib/database/global-search";

type SearchState = {
  loading: boolean;
  error: string | null;
  results: GlobalSearchResult[];
};

const INITIAL_STATE: SearchState = { loading: false, error: null, results: [] };

function formatSubmittedAt(value: string | null) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function GlobalSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>(INITIAL_STATE);
  const selectedSite = searchParams.get("site");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isCommandK) {
        event.preventDefault();
        setOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const params = new URLSearchParams({ q: query.trim() });
        if (selectedSite) params.set("site", selectedSite);
        const response = await fetch(`/api/search?${params.toString()}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { results?: GlobalSearchResult[]; error?: string };
        setState({ loading: false, error: payload.error ?? null, results: payload.results ?? [] });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({ loading: false, error: error instanceof Error ? error.message : "Search failed.", results: [] });
      }
    }, 220);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open, query, selectedSite]);

  function openPanel() {
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
  }

  function selectResult(result: GlobalSearchResult) {
    const params = new URLSearchParams(searchParams);
    params.set("highlight", result.reference);
    if (result.submittedAt) {
      const submittedDate = new Date(result.submittedAt).toISOString().slice(0, 10);
      params.set("range", "custom");
      params.set("from", submittedDate);
      params.set("to", submittedDate);
    }
    const queryString = params.toString();
    router.push(`/applications${queryString ? `?${queryString}` : ""}#application-${encodeURIComponent(result.reference)}`);
    setOpen(false);
  }

  return (
    <>
      <button className="cc-control inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm" type="button" onClick={openPanel}>
        <Search className="size-4" />
        Search
        <span className="keyboard-hint mono rounded px-1.5 py-0.5 text-[10px]">⌘K</span>
      </button>

      {open ? (
        <div className="command-overlay fixed inset-0 z-[80] flex items-start justify-center px-4 py-20" role="dialog" aria-modal="true" aria-label="Global search">
          <button className="absolute inset-0 cursor-default" type="button" aria-label="Close search" onClick={closePanel} />
          <div className="command-panel relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl">
            <div className="flex items-center gap-3 border-b border-slate-500/20 px-4 py-3">
              <Search className="size-5 text-blue-200" aria-hidden="true" />
              <input
                ref={inputRef}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reference, customer, email, or website..."
              />
              {state.loading ? <Loader2 className="size-4 animate-spin text-slate-500" aria-hidden="true" /> : null}
              <button className="cc-icon-button grid size-8 place-items-center rounded-lg" type="button" onClick={closePanel} aria-label="Close search">
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[26rem] overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">Type at least 2 characters to search applications and websites.</div>
              ) : state.error ? (
                <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{state.error}</div>
              ) : state.loading ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">Searching...</div>
              ) : state.results.length ? (
                <div className="grid gap-1">
                  {state.results.map((result) => (
                    <button
                      key={result.id}
                      className="grid gap-2 rounded-xl px-4 py-3 text-left hover:bg-white/[0.045] sm:grid-cols-[1.1fr_1fr_.8fr_.8fr]"
                      type="button"
                      onClick={() => selectResult(result)}
                    >
                      <span className="mono text-sm text-blue-100">{result.reference}</span>
                      <span className="truncate text-sm text-slate-100">{result.customerName}</span>
                      <span className="text-sm text-slate-400">{result.websiteName}</span>
                      <span className="text-sm text-slate-400 sm:text-right">{formatSubmittedAt(result.submittedAt)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-slate-400">No matching application found.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
