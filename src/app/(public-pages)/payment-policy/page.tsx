import type { Metadata } from "next";
import { BulletList, InfoCard, PublicPageShell } from "../_components/PublicPageShell";

export const metadata: Metadata = {
  title: "Payment Policy",
};

export default function PaymentPolicyPage() {
  return (
    <PublicPageShell
      eyebrow="Payments"
      title="Payment Policy"
      intro="This policy explains how seeker payments, platform fees, owner earnings, and monthly owner payouts work in the Park2bnb MVP."
    >
      <InfoCard title="Payment calculation">
        <BulletList
          items={[
            "Seekers pay the parking price plus a 5% platform fee.",
            "The platform fee is calculated on the parking price.",
            "Owner earning is the parking price, excluding the platform fee.",
          ]}
        />
        <div className="rounded-lg bg-[#eef5f1] p-4 font-bold text-[#11312c]">
          Example: Parking price Rs 100, platform fee Rs 5, total payable Rs 105.
        </div>
      </InfoCard>

      <InfoCard title="Booking and payout rules">
        <BulletList
          items={[
            "Owner payouts are manually processed monthly to the registered UPI ID.",
            "Failed payments do not confirm a booking.",
            "Exact parking location unlocks only after successful payment.",
            "The payment provider may apply its own processing rules.",
            "Refunds and cancellations are handled according to the cancellation policy or admin review.",
          ]}
        />
      </InfoCard>
    </PublicPageShell>
  );
}
