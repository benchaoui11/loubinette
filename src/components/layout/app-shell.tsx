import Link from "next/link";
import { Bell, Command } from "lucide-react";
import type { CurrentAdmin } from "@/lib/auth/current-admin";
import { DynamicNavigation } from "@/components/sites/dynamic-navigation";
import { SiteSwitcher } from "@/components/sites/site-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { DateRangeSelector } from "@/components/layout/date-range-selector";
import { GlobalSearch } from "@/components/layout/global-search";

export function AppShell({ admin, children }: { admin: CurrentAdmin; children: React.ReactNode }) {
  return (
    <div className="cc-shell">
      <aside className="cc-sidebar">
        <Link href="/command-center" className="brand-lockup mb-7 flex items-center gap-3 rounded-xl px-2 py-1.5">
          <div className="brand-mark grid size-10 place-items-center rounded-lg text-sm font-black">L</div>
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
            <DateRangeSelector />
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button className="cc-icon-button grid size-9 place-items-center rounded-lg" type="button" aria-label="Command palette">
              <Command className="size-4" />
            </button>
            <button className="cc-icon-button grid size-9 place-items-center rounded-lg" type="button" aria-label="Notifications">
              <Bell className="size-4" />
            </button>
            <div className="cc-control rounded-lg px-3 py-2 text-right">
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
