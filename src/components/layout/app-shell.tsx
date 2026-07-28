import Link from "next/link";
import { Bell, Command, Search } from "lucide-react";
import type { CurrentAdmin } from "@/lib/auth/current-admin";
import { DynamicNavigation } from "@/components/sites/dynamic-navigation";
import { SiteSwitcher } from "@/components/sites/site-switcher";

export function AppShell({ admin, children }: { admin: CurrentAdmin; children: React.ReactNode }) {
  return (
    <div className="cc-shell">
      <aside className="cc-sidebar">
        <Link href="/command-center" className="mb-7 flex items-center gap-3 rounded-xl px-2 py-1.5">
          <div className="grid size-10 place-items-center rounded-lg border border-blue-300/30 bg-blue-400/12 text-sm font-black text-blue-100">L</div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white">Loubinette</div>
            <div className="text-xs text-slate-400">IDP Control Center</div>
          </div>
        </Link>
        <DynamicNavigation />
      </aside>
      <main className="cc-main">
        <header className="cc-topbar">
          <div className="flex flex-wrap items-center gap-3">
            <SiteSwitcher />
            <div className="rounded-lg border border-slate-600/40 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">Last 30 days</div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-600/40 bg-slate-900/70 px-3 py-2 text-sm text-slate-400" type="button">
              <Search className="size-4" />
              Search
              <span className="mono rounded border border-slate-700 px-1.5 py-0.5 text-[10px]">⌘K</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="grid size-9 place-items-center rounded-lg border border-slate-600/40 bg-slate-900/70 text-slate-400" type="button" aria-label="Command palette">
              <Command className="size-4" />
            </button>
            <button className="grid size-9 place-items-center rounded-lg border border-slate-600/40 bg-slate-900/70 text-slate-400" type="button" aria-label="Notifications">
              <Bell className="size-4" />
            </button>
            <div className="rounded-lg border border-slate-600/40 bg-slate-900/70 px-3 py-2 text-right">
              <div className="text-xs font-medium text-slate-200">{admin.email}</div>
              <div className="text-[11px] text-slate-500">Owner bootstrap</div>
            </div>
          </div>
        </header>
        <div className="cc-content">{children}</div>
      </main>
    </div>
  );
}
