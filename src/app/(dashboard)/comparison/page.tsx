import { UnavailablePage } from "@/components/shared/unavailable-page";
import { SITE_CONFIGS } from "@/lib/sites/site-config";

export const metadata = { title: "Website Comparison" };

export default function ComparisonPage() {
  return <UnavailablePage eyebrow="Website Comparison" title={`${SITE_CONFIGS.length} IDP websites are configured`} body="Cross-site comparison is ready at the navigation and configuration layer. Planned websites do not show fake analytics, orders, applications, visitors, or revenue; metrics appear only after real data sources are connected." />;
}
