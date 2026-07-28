import { UnavailablePage } from "@/components/shared/unavailable-page";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return <UnavailablePage eyebrow="Settings" title="Central settings" body="Site settings will expose feature flags and configuration status without exposing raw secrets. Editing is disabled in the read-only milestone." />;
}
