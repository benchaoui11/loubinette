"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type RangeOption = {
  value: string;
  label: string;
};

const OPTIONS: RangeOption[] = [
  { value: "today", label: "Today" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
  { value: "this_month", label: "This month" },
  { value: "previous_month", label: "Previous month" },
  { value: "custom", label: "Custom range" },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function labelFor(range: string | null, from: string | null, to: string | null) {
  if (range === "custom") return from && to ? `${from} to ${to}` : "Custom range";
  return OPTIONS.find((option) => option.value === range)?.label ?? "Last 30 days";
}

export function DateRangeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const activeRange = searchParams.get("range") ?? "last_30_days";
  const activeFrom = searchParams.get("from");
  const activeTo = searchParams.get("to");
  const [customFrom, setCustomFrom] = useState(activeFrom ?? todayKey());
  const [customTo, setCustomTo] = useState(activeTo ?? todayKey());

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function applyRange(range: string, from?: string, to?: string) {
    const params = new URLSearchParams(searchParams);
    params.set("range", range);

    if (range === "custom") {
      params.set("from", from || customFrom);
      params.set("to", to || customTo);
    } else {
      params.delete("from");
      params.delete("to");
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button className="cc-control flex items-center gap-2 rounded-lg px-3 py-2 text-sm" type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <CalendarDays className="size-4 text-blue-200" />
        <span>{labelFor(activeRange, activeFrom, activeTo)}</span>
        <ChevronDown className={`size-4 text-slate-500 ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="cc-popover absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl p-2" role="menu">
          <div className="grid gap-1">
            {OPTIONS.filter((option) => option.value !== "custom").map((option) => (
              <button
                key={option.value}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/[0.045]"
                type="button"
                role="menuitem"
                onClick={() => applyRange(option.value)}
              >
                <span>{option.label}</span>
                {activeRange === option.value ? <span className="text-blue-200">Active</span> : null}
              </button>
            ))}
          </div>

          <div className="mt-2 border-t border-slate-500/20 pt-3">
            <div className="px-3 text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">Custom range</div>
            <div className="mt-2 grid gap-2 px-3">
              <label className="grid gap-1 text-xs text-slate-400">
                Start date
                <input className="cc-input rounded-lg px-3 py-2 text-sm" type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
              </label>
              <label className="grid gap-1 text-xs text-slate-400">
                End date
                <input className="cc-input rounded-lg px-3 py-2 text-sm" type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
              </label>
              <button className="cc-primary-button mt-1 rounded-lg px-3 py-2 text-sm font-medium" type="button" onClick={() => applyRange("custom", customFrom, customTo)}>
                Apply custom range
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
