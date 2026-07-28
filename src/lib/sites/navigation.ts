import type { ComponentType } from "react";
import {
  Activity,
  BarChart3,
  Boxes,
  Building2,
  FileText,
  Gauge,
  Globe2,
  Inbox,
  KeyRound,
  Layers3,
  LockKeyhole,
  Mail,
  Receipt,
  Settings,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { isFeatureEnabledForSelection, type SiteFeatureKey } from "@/lib/sites/site-config";

export type NavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  anyOf?: SiteFeatureKey[];
};

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { label: "Command Center", href: "/command-center", icon: Gauge },
  { label: "Live Activity", href: "/live-activity", icon: Activity, anyOf: ["analytics_enabled", "has_visitors", "has_orders", "has_applications"] },
  { label: "Analytics", href: "/analytics", icon: BarChart3, anyOf: ["analytics_enabled"] },
  { label: "Conversion Funnel", href: "/conversion-funnel", icon: Layers3, anyOf: ["analytics_enabled", "has_applications", "has_orders"] },
  { label: "White Page", href: "/white-page", icon: Store, anyOf: ["has_white_page"] },
  { label: "Offer Page", href: "/offer-page", icon: Store, anyOf: ["has_offer_page"] },
  { label: "Applications", href: "/applications", icon: FileText, anyOf: ["has_applications"] },
  { label: "Orders", href: "/orders", icon: Receipt, anyOf: ["has_orders"] },
  { label: "Customers", href: "/customers", icon: Users, anyOf: ["has_orders", "has_applications"] },
  { label: "Documents", href: "/documents", icon: LockKeyhole, anyOf: ["has_documents"] },
  { label: "Visitors", href: "/visitors", icon: Globe2, anyOf: ["has_visitors"] },
  { label: "Traffic Acquisition", href: "/traffic", icon: Boxes, anyOf: ["has_visitors", "analytics_enabled"] },
  { label: "Payments", href: "/payments", icon: Receipt, anyOf: ["has_orders"] },
  { label: "Emails", href: "/emails", icon: Mail, anyOf: ["has_orders", "has_applications"] },
  { label: "Website Comparison", href: "/comparison", icon: Building2 },
  { label: "Website Manager", href: "/site-control", icon: ShieldCheck },
  { label: "Team & Permissions", href: "/team", icon: KeyRound },
  { label: "Activity Log", href: "/activity-log", icon: Inbox },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export function getNavigationItemsForSite(siteId: string | null | undefined) {
  return NAVIGATION_ITEMS.filter((item) => {
    if (!item.anyOf) return true;
    return item.anyOf.some((feature) => isFeatureEnabledForSelection(siteId, feature));
  });
}
