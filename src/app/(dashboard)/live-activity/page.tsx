import { UnavailablePage } from "@/components/shared/unavailable-page";

export const metadata = { title: "Live Activity" };

export default function LiveActivityPage() {
  return <UnavailablePage eyebrow="Live Activity" title="Privacy-safe operations feed" body="Live events will use audit/event tables and narrowly scoped realtime subscriptions. Clients will not subscribe directly to sensitive raw tables." />;
}
