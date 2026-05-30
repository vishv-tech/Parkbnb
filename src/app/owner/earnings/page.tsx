"use client";

import { useEffect, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import type { OwnerMonthlyEarning } from "@/lib/types";

type EarningsResponse = {
  ownerMonthlyEarning?: OwnerMonthlyEarning;
  error?: string;
};

function rupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function monthName(month: number, year: number) {
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}

function OwnerEarningsContent() {
  const [earning, setEarning] = useState<OwnerMonthlyEarning | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/owner/earnings", { cache: "no-store" })
      .then((response) =>
        response.json().then((data: EarningsResponse) => ({
          ok: response.ok,
          data,
        })),
      )
      .then(({ ok, data }) => {
        if (!active) {
          return;
        }

        setLoading(false);

        if (!ok || !data.ownerMonthlyEarning) {
          setError(data.error || "Could not load earnings");
          return;
        }

        setEarning(data.ownerMonthlyEarning);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setError("Could not load earnings");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="app-shell py-6">
        <div className="card p-5 text-sm font-bold text-[#6b7772]">Loading earnings...</div>
      </main>
    );
  }

  return (
    <main className="app-shell safe-bottom py-6">
      <section>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Owner Earnings</p>
        <h1 className="mt-2 text-3xl font-black">Owner Earnings</h1>
      </section>

      {error && <p className="mt-5 rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}

      {earning && (
        <section className="mt-6 grid gap-4">
          <article className="card p-5 sm:p-6">
            <p className="text-sm font-black text-[#6b7772]">Total Earning of this Month</p>
            <p className="mt-3 text-4xl font-black text-[#11312c]">{rupees(earning.totalEarning)}</p>
            <p className="mt-2 text-sm font-bold text-[#6b7772]">{monthName(earning.month, earning.year)}</p>
          </article>

          <article className="card grid gap-3 p-5 text-sm font-bold text-[#40514b] sm:grid-cols-2">
            <p>Current month: {monthName(earning.month, earning.year)}</p>
            <p>Paid bookings this month: {earning.paidBookingCount}</p>
            <p>Total gross booking amount (parking price): {rupees(earning.grossBookingAmount)}</p>
            <p>Platform fee collected by Parkbnb: {rupees(earning.platformFeeAmount)}</p>
            <p>Seeker total paid: {rupees(earning.grossBookingAmount + earning.platformFeeAmount)}</p>
            <p>Final owner earning: {rupees(earning.totalEarning)}</p>
            <p>UPI ID: {earning.upiId || "Not provided"}</p>
          </article>
        </section>
      )}
    </main>
  );
}

export default function OwnerEarningsPage() {
  return (
    <ProtectedPage requiredType="OWNER">
      {() => <OwnerEarningsContent />}
    </ProtectedPage>
  );
}
