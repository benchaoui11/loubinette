import { UnavailablePage } from "@/components/shared/unavailable-page";

export const metadata = { title: "Payments" };

export default function PaymentsPage() {
  return <UnavailablePage eyebrow="Payments" title="Verified payment ledger" body="Confirmed revenue is intentionally unavailable until provider webhooks or a verified payment ledger are connected. Legacy paid statuses are not treated as verified payment." />;
}
