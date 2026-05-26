"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { StatusBadge } from "@/components/StatusBadge";
import { money } from "@/lib/format";
import type { BookingWithListing, ParkingListing } from "@/lib/types";

type ListingsResponse = {
  listings: ParkingListing[];
};

type BookingsResponse = {
  bookings: BookingWithListing[];
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm font-bold text-[#6b7772]">{label}</p>
    </div>
  );
}

function OwnerDashboardContent() {
  const [listings, setListings] = useState<ParkingListing[]>([]);
  const [bookings, setBookings] = useState<BookingWithListing[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [listingsResponse, bookingsResponse] = await Promise.all([
      fetch("/api/listings?mine=true", { cache: "no-store" }),
      fetch("/api/bookings", { cache: "no-store" }),
    ]);
    const listingsData = (await listingsResponse.json()) as ListingsResponse & { error?: string };
    const bookingsData = (await bookingsResponse.json()) as BookingsResponse & { error?: string };
    setLoading(false);

    if (!listingsResponse.ok || !bookingsResponse.ok) {
      setError(listingsData.error || bookingsData.error || "Could not load dashboard");
      return;
    }

    setListings(listingsData.listings);
    setBookings(bookingsData.bookings);
  }, []);

  useEffect(() => {
    load().catch(() => {
      setError("Could not load dashboard");
      setLoading(false);
    });
  }, [load]);

  const stats = useMemo(
    () => ({
      total: listings.length,
      live: listings.filter((listing) => listing.listingStatus === "LIVE").length,
      occupied: listings.filter((listing) => listing.availabilityStatus === "OCCUPIED").length,
      vacant: listings.filter((listing) => listing.availabilityStatus === "VACANT").length,
    }),
    [listings],
  );

  async function listingAction(id: string, action: string) {
    await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
  }

  async function deleteListing(id: string) {
    if (!window.confirm("Delete this listing?")) {
      return;
    }

    await fetch(`/api/listings/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <main className="app-shell safe-bottom py-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Owner dashboard</p>
          <h1 className="mt-2 text-3xl font-black">Your parking business</h1>
        </div>
        <Link className="btn-primary" href="/owner/list">
          Add Listing
        </Link>
      </section>

      {error && <p className="mt-5 rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total spots" value={stats.total} />
        <Stat label="Live listings" value={stats.live} />
        <Stat label="Occupied" value={stats.occupied} />
        <Stat label="Vacant" value={stats.vacant} />
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-black">Parking Listings</h2>
        {loading && <p className="mt-3 text-sm font-bold text-[#6b7772]">Loading...</p>}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {listings.map((listing) => (
            <article className="card overflow-hidden" key={listing.id}>
              <img alt={listing.buildingAddress} className="h-44 w-full object-cover" src={listing.imageUrl || "/parking-placeholder.svg"} />
              <div className="grid gap-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{listing.buildingAddress}</h3>
                    <p className="mt-1 text-sm font-bold text-[#6b7772]">Starts {money(listing.priceOneHour)}/hour</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge value={listing.availabilityStatus} />
                    <StatusBadge value={listing.listingStatus} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <button className="btn-ghost min-h-10 px-2 text-sm" onClick={() => listingAction(listing.id, "MARK_VACANT")}>
                    Mark Vacant
                  </button>
                  <button className="btn-ghost min-h-10 px-2 text-sm" onClick={() => listingAction(listing.id, "MARK_OCCUPIED")}>
                    Mark Occupied
                  </button>
                  <button className="btn-ghost min-h-10 px-2 text-sm" onClick={() => listingAction(listing.id, "TAKE_DOWN")}>
                    Take Down
                  </button>
                  <button className="btn-ghost min-h-10 px-2 text-sm" onClick={() => listingAction(listing.id, "MAKE_LIVE")}>
                    Make Live
                  </button>
                  <Link className="btn-ghost min-h-10 px-2 text-sm" href={`/owner/listings/${listing.id}/edit`}>
                    Edit
                  </Link>
                  <button className="btn-danger min-h-10 px-2 text-sm" onClick={() => deleteListing(listing.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-black">Booking Requests and Active Bookings</h2>
        <div className="mt-4 grid gap-3">
          {bookings.length === 0 && (
            <div className="card p-5 text-sm font-bold text-[#6b7772]">No bookings yet.</div>
          )}
          {bookings.map((booking) => (
            <article className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center" key={booking.id}>
              <div>
                <h3 className="font-black">{booking.seekerName}</h3>
                <p className="mt-1 text-sm font-bold text-[#6b7772]">
                  {booking.seekerContact} - {booking.carModel} - {booking.carNumber}
                </p>
                <p className="mt-1 text-sm font-bold text-[#6b7772]">
                  {booking.selectedDuration} - {money(booking.selectedPrice)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <StatusBadge value={booking.paymentStatus} />
                <StatusBadge value={booking.bookingStatus} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function OwnerDashboardPage() {
  return (
    <ProtectedPage requiredType="OWNER">
      {() => <OwnerDashboardContent />}
    </ProtectedPage>
  );
}
