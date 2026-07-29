"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { getNavigationItemsForSite } from "@/lib/sites/navigation";

function hrefWithSite(href: string, searchParams: URLSearchParams, siteId: string | null) {
  const params = new URLSearchParams(searchParams);
  params.delete("highlight");
  if (siteId) params.set("site", siteId);
  const query = params.toString();
  return query ? `${href}?${query}` : href;
}

export function DynamicNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedSiteId = searchParams.get("site");
  const navItems = getNavigationItemsForSite(selectedSiteId);

  return (
    <nav className="space-y-1">
      {navItems.map(({ label, href, icon: Icon }) => {
        const selected = pathname === href;
        return (
          <Link key={href} href={hrefWithSite(href, searchParams, selectedSiteId)} className="cc-nav-link group flex items-center gap-3 rounded-lg px-3 py-2 text-sm" data-selected={selected}>
            <Icon className="size-4" aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
