"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { StatusBadge } from "@/components/StatusBadge";
import { money } from "@/lib/format";
import type { BookingWithListing, ParkingListing, PublicListing } from "@/lib/types";

function listingLabel(listing: ParkingListing | PublicListing | null) {
  if (!listing) {
    return "Parking spot";
  }

  return "buildingAddress" in listing ? listing.buildingAddress : listing.generalArea;
}

function MyBookingsContent() {
  const [bookings, setBookings] = useState<BookingWithListing[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { bookings?: BookingWithListing[]; error?: string }) => {
        setLoading(false);

        if (data.error || !data.bookings) {
          setError(data.error || "Could not load bookings");
          return;
        }

        setBookings(data.bookings);
      })
      .catch(() => {
        setError("Could not load bookings");
        setLoading(false);
      });
  }, []);

  return (
    <main className="app-shell safe-bottom py-6">
      <section>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Your trips</p>
        <h1 className="mt-2 text-3xl font-black">My Bookings</h1>
      </section>

      {error && <p className="mt-5 rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}
      {loading && <div className="card mt-5 p-5 text-sm font-bold text-[#6b7772]">Loading bookings...</div>}

      <section className="mt-5 grid gap-4">
        {!loading && bookings.length === 0 && (
          <div className="card p-5">
            <p className="font-bold text-[#6b7772]">No bookings yet.</p>
            <Link className="btn-primary mt-4" href="/seeker/results">
              Find Parking
            </Link>
          </div>
        )}
        {bookings.map((booking) => (
          <article className="card grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center" key={booking.id}>
            <div>
              <h2 className="text-lg font-black">{listingLabel(booking.listing)}</h2>
              <p className="mt-1 text-sm font-bold text-[#6b7772]">
                {booking.selectedDuration} - {money(booking.selectedPrice)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge value={booking.paymentStatus} />
                <StatusBadge value={booking.bookingStatus} />
              </div>
            </div>
            {booking.paymentStatus === "PAID" ? (
              <Link className="btn-primary" href={`/booking/${booking.id}/confirmed`}>
                View Details
              </Link>
            ) : (
              <Link className="btn-secondary" href={`/payment/${booking.id}`}>
                Complete Payment
              </Link>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}

export default function MyBookingsPage() {
  return (
    <ProtectedPage requiredType="SEEKER">
      {() => <MyBookingsContent />}
    </ProtectedPage>
  );
}
