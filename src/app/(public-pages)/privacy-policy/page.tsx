import type { Metadata } from "next";
import { BulletList, InfoCard, PublicPageShell } from "../_components/PublicPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <PublicPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This Privacy Policy explains the basic information Parkbnb collects and uses for account creation, parking listings, bookings, payments, and support."
    >
      <InfoCard title="Data we collect">
        <BulletList
          items={[
            "Name.",
            "Email.",
            "Contact number.",
            "Car details.",
            "UPI ID for owners.",
            "Parking listing details.",
            "Live location coordinates.",
            "Booking and payment status.",
            "Issue reports.",
          ]}
        />
      </InfoCard>

      <InfoCard title="Why we collect data">
        <BulletList
          items={[
            "Account creation and login.",
            "Parking listing setup and management.",
            "Booking creation and confirmation.",
            "Payment tracking.",
            "Owner payouts.",
            "Safety, support, and dispute handling.",
          ]}
        />
      </InfoCard>

      <InfoCard title="Data sharing">
        <BulletList
          items={[
            "The parking owner receives seeker details after booking and payment.",
            "The parking seeker receives owner contact details and exact parking location after payment.",
            "Admins can view data for operations, support, safety, and dispute handling.",
          ]}
        />
      </InfoCard>

      <InfoCard title="Payments and location">
        <p>
          Payment details are processed through the payment provider. Parkbnb should not store card
          passwords, bank passwords, or similar payment credentials.
        </p>
        <p>
          Location coordinates are used to help seekers find nearby parking and to provide directions
          after a successful booking payment.
        </p>
      </InfoCard>

      <InfoCard title="User responsibility and contact">
        <p>Users should provide accurate and current information while using Parkbnb.</p>
        <p>For privacy questions, contact support@parkbnb.com.</p>
        <p className="rounded-lg bg-[#fff5ef] p-4 font-bold text-[#8d3b24]">
          This is a draft policy for MVP/testing and should be legally reviewed before public launch.
        </p>
      </InfoCard>
    </PublicPageShell>
  );
}
