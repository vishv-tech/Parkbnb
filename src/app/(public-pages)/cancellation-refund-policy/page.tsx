import type { Metadata } from "next";
import { BulletList, InfoCard, PublicPageShell } from "../_components/PublicPageShell";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
};

export default function CancellationRefundPolicyPage() {
  return (
    <PublicPageShell
      eyebrow="Bookings"
      title="Cancellation & Refund Policy"
      intro="These are basic MVP cancellation and refund rules for Park2bnb bookings."
    >
      <InfoCard title="MVP rules">
        <BulletList
          items={[
            "Booking confirmation happens after successful payment.",
            "Cancellation and refund requests may be reviewed by admin.",
            "No automatic refund is guaranteed in the MVP.",
            "If a parking owner cancels or the spot is unavailable, admin may review the refund request.",
            "If a seeker overstays or violates rules, refund may be denied.",
            "Issue reports may affect refund or fine decisions.",
          ]}
        />
        <p>For cancellation or refund support, contact support@park2bnb.com.</p>
      </InfoCard>
    </PublicPageShell>
  );
}
