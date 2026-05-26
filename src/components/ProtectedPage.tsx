"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { SafeUser, UserType } from "@/lib/types";

type ProtectedPageProps = {
  requiredType?: UserType;
  children: (user: SafeUser) => ReactNode;
};

export function ProtectedPage({ requiredType, children }: ProtectedPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { user: SafeUser | null }) => {
        if (!active) {
          return;
        }

        if (!data.user) {
          router.replace("/login");
          return;
        }

        if (requiredType && data.user.userType !== requiredType) {
          router.replace(data.user.userType === "OWNER" ? "/owner/dashboard" : "/seeker/profile");
          return;
        }

        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          router.replace("/login");
        }
      });

    return () => {
      active = false;
    };
  }, [requiredType, router]);

  if (loading || !user) {
    return (
      <main className="app-shell py-10">
        <div className="card p-6 text-sm font-bold text-[#6b7772]">Loading your workspace...</div>
      </main>
    );
  }

  return <>{children(user)}</>;
}
