import type { Metadata } from "next";
import { BulletList, InfoCard, PublicPageShell } from "../_components/PublicPageShell";

export const metadata: Metadata = {
  title: "How Parkbnb Works",
};

export default function HowItWorksPage() {
  return (
    <PublicPageShell
      eyebrow="How it works"
      title="How Parkbnb Works"
      intro="Parkbnb gives owners a way to list usable parking space and gives drivers a guided flow to find, book, and reach nearby parking."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <InfoCard title="For Parking Owners">
          <BulletList
            items={[
              "Sign up as Parking Owner.",
              "Add UPI ID for monthly payouts.",
              "List parking spot.",
              "Add live location.",
              "Add availability schedule.",
              "Set hourly price.",
              "Receive bookings.",
              "Track monthly earnings.",
            ]}
          />
        </InfoCard>

        <InfoCard title="For Parking Seekers">
          <BulletList
            items={[
              "Sign up as Parking Seeker.",
              "Add car details.",
              "Allow live location.",
              "Find nearby available parking.",
              "Select duration.",
              "Pay booking amount plus platform fee.",
              "Get exact address and directions after payment.",
            ]}
          />
        </InfoCard>
      </div>
    </PublicPageShell>
  );
}
