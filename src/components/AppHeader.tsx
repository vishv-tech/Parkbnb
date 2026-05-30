"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SafeUser } from "@/lib/types";

type AuthState = {
  user: SafeUser | null;
  admin: { email: string } | null;
};

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/payment-policy", label: "Payment Policy" },
  { href: "/contact", label: "Contact / Socials" },
];

const ownerLinks = [
  { href: "/owner/dashboard", label: "Dashboard" },
  { href: "/owner/list", label: "List Spot" },
  { href: "/owner/earnings", label: "Earnings" },
];

const seekerLinks = [
  { href: "/seeker/results", label: "Find Parking" },
  { href: "/my-bookings", label: "My Bookings" },
];

const adminLinks = [
  { href: "/admin", label: "Admin Dashboard" },
  { href: "/admin/users", label: "All Users" },
  { href: "/admin/earnings", label: "Owner Monthly Earnings" },
  { href: "/admin/listings", label: "All Parking Listings" },
  { href: "/admin/bookings", label: "All Bookings" },
  { href: "/admin/issue-reports", label: "Issue Reports" },
];

const navLinkClass = "rounded-lg px-3 py-2 text-[#40514b] hover:bg-[#f6f7f9]";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ user: null, admin: null });
  const [authReady, setAuthReady] = useState(false);
  const showAdminNavigation = Boolean(auth.admin);
  const showOwnerNavigation = Boolean(!auth.admin && auth.user?.userType === "OWNER");
  const showSeekerNavigation = Boolean(!auth.admin && auth.user?.userType === "SEEKER");
  const showPublicNavigation = Boolean(authReady && !auth.user && !auth.admin);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: AuthState) => {
        if (active) {
          setAuth({ user: data.user, admin: data.admin });
          setAuthReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setAuth({ user: null, admin: null });
          setAuthReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuth({ user: null, admin: null });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#dbe3df] bg-white/92 backdrop-blur">
      <div className="app-shell flex min-h-16 flex-col items-start justify-between gap-3 py-3 sm:flex-row sm:items-center">
        <Link href="/" className="flex items-center gap-2 font-black text-[#11312c]">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#11312c] text-white">
            P
          </span>
          <span>Park2bnb</span>
        </Link>

        <nav className="flex w-full flex-wrap items-center gap-2 text-sm font-bold sm:w-auto sm:justify-end">
          {showPublicNavigation && (
            <>
              {publicLinks.map((link) => (
                <Link className={navLinkClass} href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
              <Link className="btn-ghost min-h-10 px-3 py-2" href="/login">
                Login
              </Link>
              <Link className="btn-primary min-h-10 px-3 py-2" href="/signup">
                Sign Up
              </Link>
            </>
          )}
          {showAdminNavigation && (
            <>
              {adminLinks.map((link) => (
                <Link className={navLinkClass} href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </>
          )}
          {showOwnerNavigation && (
            <>
              {ownerLinks.map((link) => (
                <Link className={navLinkClass} href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </>
          )}
          {showSeekerNavigation && (
            <>
              {seekerLinks.map((link) => (
                <Link className={navLinkClass} href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </>
          )}
          {(auth.user || auth.admin) && (
            <button className="btn-ghost min-h-10 px-3 py-2" onClick={logout}>
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
