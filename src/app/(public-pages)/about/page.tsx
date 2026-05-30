import type { Metadata } from "next";
import { BulletList, InfoCard, PublicPageShell } from "../_components/PublicPageShell";

export const metadata: Metadata = {
  title: "About Parkbnb",
};

export default function AboutPage() {
  return (
    <PublicPageShell
      eyebrow="About us"
      title="About Parkbnb"
      intro="Parkbnb is an Airbnb-style parking marketplace where parking owners can list unused parking spaces and drivers can find and book nearby parking."
    >
      <InfoCard title="A simpler parking marketplace">
        <p>
          Parkbnb connects people who have available parking space with drivers who need safe,
          convenient parking near their destination. Owners can publish parking availability, and
          seekers can discover spaces that match their timing and location needs.
        </p>
      </InfoCard>

      <InfoCard title="What Parkbnb helps with">
        <BulletList
          items={[
            "Owners earn from unused parking spaces.",
            "Seekers find safe and convenient parking.",
            "Crowded cities get less parking stress through better use of private spaces.",
            "Hourly and scheduled parking availability can be supported.",
          ]}
        />
      </InfoCard>
    </PublicPageShell>
  );
}
