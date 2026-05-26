"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SafeUser } from "@/lib/types";

type AuthState = {
  user: SafeUser | null;
  admin: { email: string } | null;
};

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ user: null, admin: null });

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: AuthState) => {
        if (active) {
          setAuth({ user: data.user, admin: data.admin });
        }
      })
      .catch(() => undefined);

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
      <div className="app-shell flex min-h-16 items-center justify-between gap-3 py-3">
        <Link href="/" className="flex items-center gap-2 font-black text-[#11312c]">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#11312c] text-white">
            P
          </span>
          <span>Park2bnb</span>
        </Link>

        <nav className="flex items-center gap-2 text-sm font-bold">
          {auth.user?.userType === "OWNER" && (
            <>
              <Link className="hidden rounded-lg px-3 py-2 text-[#40514b] sm:inline-flex" href="/owner/dashboard">
                Dashboard
              </Link>
              <Link className="hidden rounded-lg px-3 py-2 text-[#40514b] sm:inline-flex" href="/owner/list">
                List Spot
              </Link>
            </>
          )}
          {auth.user?.userType === "SEEKER" && (
            <>
              <Link className="hidden rounded-lg px-3 py-2 text-[#40514b] sm:inline-flex" href="/seeker/results">
                Find
              </Link>
              <Link className="hidden rounded-lg px-3 py-2 text-[#40514b] sm:inline-flex" href="/my-bookings">
                Bookings
              </Link>
            </>
          )}
          {auth.admin && (
            <Link className="hidden rounded-lg px-3 py-2 text-[#40514b] sm:inline-flex" href="/admin">
              Admin
            </Link>
          )}
          {auth.user || auth.admin ? (
            <button className="btn-ghost min-h-10 px-3 py-2" onClick={logout}>
              Logout
            </button>
          ) : (
            <Link className="btn-primary min-h-10 px-3 py-2" href="/login">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
