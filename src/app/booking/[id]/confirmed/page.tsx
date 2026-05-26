"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ExactMap } from "@/components/ExactMap";
import { ProtectedPage } from "@/components/ProtectedPage";
import { Receipt } from "@/components/Receipt";
import { StatusBadge } from "@/components/StatusBadge";
import type { BookingWithListing, ParkingListing } from "@/lib/types";

function isFullListing(listing: BookingWithListing["listing"]): listing is ParkingListing {
  return Boolean(listing && "latitude" in listing && "buildingAddress" in listing);
}

function BookingConfirmedContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingWithListing | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings/${params.id}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { booking?: BookingWithListing; error?: string }) => {
        setLoading(false);

        if (!data.booking || data.error) {
          setError(data.error || "Booking not found");
          return;
        }

        if (data.booking.paymentStatus !== "PAID") {
          router.replace(`/payment/${data.booking.id}`);
          return;
        }

        setBooking(data.booking);
      })
      .catch(() => {
        setError("Could not load booking");
        setLoading(false);
      });
  }, [params.id, router]);

  if (loading) {
    return (
      <main className="app-shell py-6">
        <div className="card p-5 text-sm font-bold text-[#6b7772]">Unlocking your parking details...</div>
      </main>
    );
  }

  if (!booking || !isFullListing(booking.listing)) {
    return (
      <main className="app-shell py-6">
        <div className="card p-5 text-sm font-bold text-[#a93c22]">{error || "Exact location is not unlocked yet."}</div>
      </main>
    );
  }

  const listing = booking.listing;

  return (
    <main className="app-shell safe-bottom py-6">
      <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Booking confirmed</p>
          <h1 className="mt-2 text-3xl font-black">Exact Location Unlocked</h1>
        </div>
        <StatusBadge value={booking.paymentStatus} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <Receipt booking={booking} listing={listing} />

        <section className="grid gap-5">
          <article className="card overflow-hidden">
            <img alt={listing.buildingAddress} className="h-56 w-full object-cover" src={listing.imageUrl || "/parking-placeholder.svg"} />
            <div className="grid gap-4 p-5">
              <div>
                <h2 className="text-2xl font-black">{listing.buildingAddress}</h2>
                <p className="mt-2 text-sm font-bold text-[#6b7772]">Owner contact: {listing.ownerContactNumber}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-[#f8fbfa] p-4">
                  <p className="text-sm font-black text-[#40514b]">Parking Floor</p>
                  <p className="mt-1 font-bold text-[#6b7772]">{listing.parkingFloor}</p>
                </div>
                <div className="rounded-lg bg-[#f8fbfa] p-4">
                  <p className="text-sm font-black text-[#40514b]">Gate and Slot</p>
                  <p className="mt-1 font-bold text-[#6b7772]">{listing.parkingAddressDetails}</p>
                </div>
              </div>
              <div className="rounded-lg bg-[#f8fbfa] p-4">
                <p className="text-sm font-black text-[#40514b]">Parking Directions</p>
                <p className="mt-1 font-bold leading-7 text-[#6b7772]">{listing.parkingDirections}</p>
              </div>
            </div>
          </article>

          <ExactMap latitude={listing.latitude} longitude={listing.longitude} label={listing.buildingAddress} />

          <Link className="btn-ghost" href="/my-bookings">
            Go To Your Bookings
          </Link>
        </section>
      </div>
    </main>
  );
}

export default function BookingConfirmedPage() {
  return (
    <ProtectedPage requiredType="SEEKER">
      {() => <BookingConfirmedContent />}
    </ProtectedPage>
  );
}
