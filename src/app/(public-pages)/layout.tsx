import Link from "next/link";
import type { ReactNode } from "react";

const footerLinks = [
  { href: "/about", label: "About Us" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/payment-policy", label: "Payment Policy" },
  { href: "/cancellation-refund-policy", label: "Cancellation & Refund Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/contact", label: "Contact" },
];

export default function PublicPagesLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      {children}
      <footer className="border-t border-[#dbe3df] bg-white">
        <div className="app-shell flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-black text-[#11312c]">Park2bnb</p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold text-[#40514b]">
            {footerLinks.map((link) => (
              <Link className="hover:text-[#11312c]" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}
