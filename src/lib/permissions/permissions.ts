import type { CurrentAdmin } from "@/lib/auth/current-admin";

export type Permission =
  | "sites.view_all"
  | "analytics.view"
  | "applications.view"
  | "documents.view_metadata"
  | "financials.view_submitted"
  | "settings.view";

const OWNER_PERMISSIONS: Permission[] = [
  "sites.view_all",
  "analytics.view",
  "applications.view",
  "documents.view_metadata",
  "financials.view_submitted",
  "settings.view",
];

export function hasPermission(admin: CurrentAdmin, permission: Permission) {
  if (admin.role === "owner_bootstrap") return OWNER_PERMISSIONS.includes(permission);
  return false;
}
