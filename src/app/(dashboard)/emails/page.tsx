import { UnavailablePage } from "@/components/shared/unavailable-page";

export const metadata = { title: "Emails" };

export default function EmailsPage() {
  return <UnavailablePage eyebrow="Emails" title="Resend event architecture" body="Email sending exists in FirstIDP, but historical delivery/open/click/bounce events are unavailable until Resend webhook logging is connected." />;
}
