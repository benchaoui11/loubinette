import { UnavailablePage } from "@/components/shared/unavailable-page";

export const metadata = { title: "Activity Log" };

export default function ActivityLogPage() {
  return <UnavailablePage eyebrow="Activity Log" title="Append-only admin audit log" body="Audit tables are prepared in migrations. Mutations remain disabled until every sensitive read/write can be logged safely." />;
}
