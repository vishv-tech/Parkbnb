import type { Metadata } from "next";
import { InfoCard, PublicPageShell } from "../_components/PublicPageShell";

export const metadata: Metadata = {
  title: "Contact & Socials",
};

const contacts = [
  { label: "Email", value: "support@parkbnb.com" },
  { label: "Instagram", value: "Coming soon" },
  { label: "LinkedIn", value: "Coming soon" },
  { label: "X/Twitter", value: "Coming soon" },
  { label: "WhatsApp support", value: "Coming soon" },
];

export default function ContactPage() {
  return (
    <PublicPageShell
      eyebrow="Contact"
      title="Contact & Socials"
      intro="For support, partnership, owner payout questions, booking issues, or reports, contact us."
    >
      <InfoCard title="Reach Parkbnb">
        <div className="grid gap-3 sm:grid-cols-2">
          {contacts.map((contact) => (
            <div className="rounded-lg border border-[#dbe3df] bg-[#f6f7f9] p-4" key={contact.label}>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-[#6b7772]">{contact.label}</p>
              <p className="mt-1 font-black text-[#11312c]">{contact.value}</p>
            </div>
          ))}
        </div>
      </InfoCard>
    </PublicPageShell>
  );
}
