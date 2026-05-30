import type { Metadata } from "next";
import { BulletList, InfoCard, PublicPageShell } from "../_components/PublicPageShell";

export const metadata: Metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Legal"
      title="Terms & Conditions"
      intro="These Terms & Conditions describe basic responsibilities for using the Parkbnb MVP as a parking owner, parking seeker, or platform admin user."
    >
      <InfoCard title="Platform terms">
        <BulletList
          items={[
            "Parkbnb is a parking marketplace connecting parking owners and parking seekers.",
            "Users must provide correct information.",
            "Owners must list only parking spaces they are allowed to rent.",
            "Seekers must park only during the booked duration.",
            "Seekers must remove vehicles on time.",
            "Overstaying may lead to a warning, fine, or admin action.",
            "Owners can report issues.",
            "Parkbnb may block users for misuse.",
            "Parkbnb is not responsible for false information submitted by users.",
            "Safety concerns and disputes are handled through admin review.",
            "Monthly payouts are manual and based on verified paid bookings.",
            "This is an MVP/testing policy and should be legally reviewed before launch.",
          ]}
        />
      </InfoCard>
    </PublicPageShell>
  );
}
