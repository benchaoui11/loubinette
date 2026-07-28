import { UnavailablePage } from "@/components/shared/unavailable-page";

export const metadata = { title: "Customers" };

export default function CustomersPage() {
  return <UnavailablePage eyebrow="Customers" title="Customer intelligence" body="Customer views will derive from normalized email and application history. No duplicate identity merging will be inferred from names alone." />;
}
