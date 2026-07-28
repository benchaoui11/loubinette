"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getNavigationItemsForSite } from "@/lib/sites/navigation";

function hrefWithSite(href: string, siteId: string | null) {
  if (!siteId) return href;
  const params = new URLSearchParams({ site: siteId });
  return `${href}?${params.toString()}`;
}

export function DynamicNavigation() {
  const searchParams = useSearchParams();
  const selectedSiteId = searchParams.get("site");
  const navItems = getNavigationItemsForSite(selectedSiteId);

  return (
    <nav className="space-y-1">
      {navItems.map(({ label, href, icon: Icon }) => (
        <Link key={href} href={hrefWithSite(href, selectedSiteId)} className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/[0.045] hover:text-slate-100">
          <Icon className="size-4 text-slate-500 group-hover:text-blue-200" aria-hidden />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
