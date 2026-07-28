import { UnavailablePage } from "@/components/shared/unavailable-page";

export const metadata = { title: "Orders" };

export default function OrdersPage() {
  return <UnavailablePage eyebrow="Orders" title="Commercial orders architecture" body="FirstIDP currently stores submissions in applications and collects payment manually. Real orders will be enabled after the additive order/payment ledger migration is verified." />;
}
