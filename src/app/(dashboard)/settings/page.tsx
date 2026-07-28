import { SendTestEmailButton } from "@/components/settings/send-test-email-button";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Central settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Admin diagnostics and configuration checks. Existing email flows are unchanged.</p>
      </div>
      <SendTestEmailButton />
    </div>
  );
}
