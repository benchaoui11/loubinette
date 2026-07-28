import { UnavailablePage } from "@/components/shared/unavailable-page";

export const metadata = { title: "Team & Permissions" };

export default function TeamPage() {
  return <UnavailablePage eyebrow="Team & Permissions" title="RBAC administration" body="Owner bootstrap is active through OWNER_ADMIN_EMAIL. Team management is disabled until admin_profiles, roles, permissions, and site access policies are migrated." />;
}
